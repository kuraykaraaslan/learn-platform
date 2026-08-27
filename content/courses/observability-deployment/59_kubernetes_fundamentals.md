# 59. Kubernetes Fundamentals — Pod, Service, Ingress, HPA

## What It Is
Kubernetes (K8s) is a container orchestration platform: it runs your Docker containers across a cluster of machines, restarts them when they crash, scales them when traffic increases, and routes traffic to healthy instances. It is the dominant production runtime for containerized applications.

Understanding the four core primitives — Pod, Service, Ingress, and HPA — gets you 80% of the way to running a Next.js SaaS on Kubernetes.

A **Pod** is the smallest deployable unit: one or more containers running together, sharing a network namespace and storage. You rarely create Pods directly; you create a **Deployment** that manages a set of identical Pods and handles rolling updates. A **Service** is a stable DNS name and virtual IP in front of a set of Pods; it provides load balancing and ensures that when old pods are replaced by new ones during a deploy, client connections are routed correctly without needing to know individual pod IPs. An **Ingress** is the HTTP/HTTPS router at the edge: it terminates TLS, handles host-based and path-based routing, and directs traffic from the internet to the right Service. A **HorizontalPodAutoscaler (HPA)** watches a metric (usually CPU or custom metrics) and automatically adjusts the number of Pod replicas up and down.

For your multi-tenant SaaS, a typical Kubernetes setup would be: one Deployment for the Next.js app, one for BullMQ workers, Services for internal communication, an Ingress (usually nginx-ingress or Traefik) for external HTTPS routing, and HPAs on both Deployments so they scale with load.

## Key Concepts
- **Pod** — the atomic unit; one running instance of your container(s); has its own IP inside the cluster
- **Deployment** — declares the desired state (3 replicas of this image); manages rollouts and self-healing
- **Service (ClusterIP)** — internal load balancer with a stable DNS name; routes to pods by label selector
- **Service (LoadBalancer)** — external load balancer provisioned by the cloud; expensive, use Ingress instead
- **Ingress** — layer-7 HTTP router; handles TLS termination, virtual hosting, path routing
- **HPA** — scales Deployment replica count based on CPU, memory, or custom metrics
- **ConfigMap / Secret** — inject non-sensitive and sensitive configuration into pods at runtime
- **Namespace** — virtual cluster isolation; use separate namespaces for staging and production in the same cluster
- **`kubectl`** — the CLI for interacting with Kubernetes: `apply`, `get`, `logs`, `exec`, `rollout`

## Example Code
```yaml
# k8s/deployment.yaml — Next.js app Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: acme-web
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: acme-web
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  template:
    metadata:
      labels:
        app: acme-web
    spec:
      containers:
        - name: app
          image: ghcr.io/your-org/acme-web:${GIT_SHA}  # pinned to commit SHA, never :latest
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: acme-web-secrets  # DATABASE_URL, JWT secrets, etc.
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              cpu: "100m"     # 0.1 CPU cores — minimum guaranteed
              memory: "256Mi"
            limits:
              cpu: "500m"     # burst up to 0.5 cores
              memory: "512Mi"
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 15"]  # drain in-flight requests
---
# k8s/service.yaml — internal ClusterIP Service
apiVersion: v1
kind: Service
metadata:
  name: acme-web
  namespace: production
spec:
  selector:
    app: acme-web   # routes to pods with this label
  ports:
    - port: 80
      targetPort: 3000
---
# k8s/ingress.yaml — HTTPS routing via nginx-ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: acme-web
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"    # auto TLS via cert-manager
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - app.yourdomain.com
      secretName: acme-web-tls
  rules:
    - host: app.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: acme-web
                port:
                  number: 80
---
# k8s/hpa.yaml — scale 2–10 replicas based on CPU usage
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: acme-web
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: acme-web
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60   # scale out when avg CPU > 60%
```

## When to Use
1. **Multi-region or high-availability requirements** — when a single server is not enough; K8s spans your app across multiple nodes automatically.
2. **Variable traffic patterns** — HPA scales your Next.js pods during a product launch spike and scales back down at night, paying only for what you use.
3. **Separate scaling for app vs. worker** — your BullMQ worker Deployment can scale independently from the Next.js web Deployment based on queue depth.
4. **Zero-downtime deploys as a baseline requirement** — Kubernetes rolling updates with readiness probes give you this by default once configured correctly.
5. **Multi-tenant isolation via namespaces** — you can run separate tenant namespaces with resource quotas for your larger customers.

## Common Mistakes
- **Using `:latest` image tag** — K8s will not re-pull an image with the same tag if it is already cached. Always pin to a unique tag (e.g., git commit SHA) so a new deploy actually deploys new code.
- **No resource limits** — without `resources.limits`, one runaway pod can starve all other pods on the node. Always set both `requests` and `limits`.
- **Storing secrets in ConfigMaps** — ConfigMaps are not encrypted. Use `Secret` objects for sensitive data, and ideally integrate with an external secrets manager (AWS Secrets Manager, HashiCorp Vault).
- **Single replica in production** — one pod means any node drain, rolling update, or crash causes downtime. Always run at least 2 replicas for production workloads.

## Further Reading
- Kubernetes official documentation: https://kubernetes.io/docs/home/
- `kubectl` cheatsheet: https://kubernetes.io/docs/reference/kubectl/cheatsheet/
- Kelsey Hightower — "Kubernetes the Hard Way": https://github.com/kelseyhightower/kubernetes-the-hard-way
- [Kubernetes concepts](https://kubernetes.io/docs/concepts/) — the official model for workloads, services and configuration
