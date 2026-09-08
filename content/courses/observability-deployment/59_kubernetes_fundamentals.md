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

Three Kubernetes defaults decide how a pod behaves under conditions nobody
tests for, and all three are documented values rather than anything the
manifest states:

```numbers
caption: "Defaults that apply when a manifest is silent. Documented rather than measured — CI has no cluster to read them from."
rows:
  - quantity: "`terminationGracePeriodSeconds`"
    default: "30"
    source: "https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/"
    at_scale: "It is the window between SIGTERM and SIGKILL. A process that drains connections, finishes in-flight requests or flushes a buffer has thirty seconds total — and if the readiness probe is still routing traffic during the first few of them, the drain has not even started."
    measure: "`kubectl get pod <name> -o jsonpath='{.spec.terminationGracePeriodSeconds}'` and time an actual rollout with `kubectl get events --watch`"
  - quantity: "CPU and memory `requests`"
    default: "— none, unless a LimitRange sets one"
    source: "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"
    at_scale: "A pod with no request is scheduled as if it needs nothing, so the scheduler will pack a node past what it can serve. It is also the lowest QoS class, so it is the first thing evicted when that node runs short."
    measure: "`kubectl get pods -o custom-columns=NAME:.metadata.name,REQ:.spec.containers[*].resources.requests` across a namespace and count the empties"
  - quantity: "Pod `restartPolicy`"
    default: "Always"
    source: "https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/"
    at_scale: "A container that exits is restarted with an exponential back-off capped at five minutes. A process crashing on a bad config therefore looks like a slow, partial outage rather than a failure, and the pod reports `CrashLoopBackOff` long after the cause has scrolled out of the logs."
    measure: "`kubectl get pods` and read the RESTARTS column, then `kubectl logs <pod> --previous` for the run that actually failed"
```

The second row is the one that produces surprises. A manifest with no resource
requests is not neutral — it is a specific choice with a specific consequence
at scheduling time and another at eviction time, and neither appears anywhere
in the file that made it.

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
