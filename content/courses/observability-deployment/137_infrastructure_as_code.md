# 137. Infrastructure as Code — Terraform / Pulumi

## What It Is
Infrastructure as Code means defining cloud resources (networks, databases, compute, DNS records) as versioned, reviewable code instead of manual console clicks that leave no history and no diff. The core workflow is **declarative**: you describe the desired end state ("an RDS Postgres instance, this size, in this subnet"), and the tool (Terraform, Pulumi, CloudFormation) computes the difference between that and reality, then applies only the changes needed — you don't script the individual steps to get there.

The **state file** is the part that trips people up: it's the tool's record of what it believes currently exists, and it's what the next `plan` diffs your code against. Manually editing cloud resources outside the tool causes **drift** — the state file now lies about reality, and the next `apply` can produce surprising, sometimes destructive results trying to reconcile a difference it doesn't actually understand. This is why "someone clicked a button in the AWS console to fix it quickly" is one of the most common sources of IaC incidents — it's a shortcut that borrows against a future, much worse debugging session.

## Key Concepts
- **Declarative vs imperative**: describe the desired end state; the tool computes and applies the diff, rather than you scripting each step
- **State file**: the tool's record of what it believes exists — the source of truth it diffs against, and dangerous to hand-edit
- **Plan/apply workflow**: `plan` shows exactly what will change before anything happens; `apply` executes it — never skip reviewing the plan
- **Drift**: reality diverging from the state file, usually from manual out-of-band changes
- **Modules**: reusable, parameterized bundles of resources (e.g. "a standard VPC") instead of copy-pasting the same resource block per environment
- **Remote state + locking**: state stored centrally (not on a laptop) with a lock so two people can't `apply` concurrently and corrupt it

## Example Code
```hcl
# main.tf — a minimal, reviewable definition of a managed Postgres instance
resource "aws_db_instance" "app_db" {
  identifier        = "app-db-prod"
  engine            = "postgres"
  engine_version    = "16.3"
  instance_class    = "db.t3.medium"
  allocated_storage = 50
  db_name           = "appdb"
  username          = var.db_username
  password          = var.db_password         # sourced from a secrets manager, never hardcoded
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  backup_retention_period = 7                  # ties directly to #49 Backup Strategy — RTO/RPO
  skip_final_snapshot     = false
}

resource "aws_security_group" "db_sg" {
  name   = "app-db-sg"
  vpc_id = var.vpc_id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]   # only the app tier, nothing else
  }
}
```

```bash
# The workflow — plan is the safety net, never skip reading it
terraform init
terraform plan -out=tfplan     # review EVERY line before proceeding
terraform apply tfplan
```

## When to Use
- Any infrastructure beyond "one server you SSH into and remember by hand" — reproducibility, disaster recovery, and multi-environment parity all depend on it
- Standing up a new environment (staging, a new region) that should be identical to an existing one
- Any change to production infrastructure — code review on the diff catches mistakes a console click never would

## Common Mistakes
- Manual console changes causing drift from the IaC state, discovered only when the next `apply` tries to "fix" something that was never broken
- Storing the state file with secrets unencrypted, or committing it to git — it often contains sensitive values in plaintext
- Applying without reviewing the `plan` output first, especially on a shared/production workspace
- Giant, undifferentiated modules that make every environment's configuration a copy-pasted wall of resources instead of parameterized and reused

## Further Reading
- "Terraform: Up & Running" by Yevgeniy Brikman
- Terraform official documentation — "State" section (understanding what the state file actually is)
- Pulumi docs, if preferring real programming languages over HCL — same core concepts, different syntax
