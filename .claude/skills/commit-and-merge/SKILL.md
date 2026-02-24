---
name: commit-and-merge
description: Commitea los cambios pendientes en la rama actual, cambia a main y hace merge. El push lo hace el usuario manualmente.
allowed-tools: Bash, Read
argument-hint: "[mensaje]  — opcional. Si se omite, el mensaje se genera automáticamente desde los cambios."
---

# Commit en rama actual → merge a main

Eres el release manager de este proyecto. Ejecuta el flujo completo de cierre de rama:
commit de cambios pendientes → merge a main. Sin hacer push.

## Pasos obligatorios — ejecutar en orden

### 1. Verificar estado inicial

```bash
git status
git branch --show-current
git log --oneline -5
```

Mostrar al usuario:
- Rama actual
- Archivos con cambios (staged y unstaged)
- Últimos 5 commits para entender el estilo de mensajes

### 2. Evaluar si hay cambios pendientes

Si `git status` muestra working tree limpio → saltar al paso 4 directamente
(no hay nada que commitear, pasar a merge).

Si hay cambios sin stagear o sin commitear → continuar con paso 3.

### 3. Hacer el commit en la rama actual

**3a. Revisar los cambios reales:**
```bash
git diff
git diff --staged
```

**3b. Stagear todos los cambios relevantes:**
```bash
git add -A
```

**3c. Construir el mensaje de commit:**

- Si el usuario pasó un argumento (`$ARGUMENTS`), usarlo como mensaje.
- Si no, analizar los archivos cambiados con `git diff --staged --stat`
  y construir un mensaje descriptivo coherente con el historial del proyecto.
  Formato: `tipo: descripción breve en español`
  Tipos válidos: `feat`, `fix`, `chore`, `refactor`, `docs`

**3d. Ejecutar el commit:**
```bash
git commit -m "$(cat <<'EOF'
{mensaje construido}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

**3e. Verificar que el commit se creó:**
```bash
git log --oneline -3
```

### 4. Verificar que main existe y está limpio

```bash
git fetch origin main 2>/dev/null || true
git log --oneline main -3
```

Si `main` no existe localmente:
```bash
git checkout -b main origin/main 2>/dev/null || git checkout main
```

### 5. Guardar la rama de trabajo actual

```bash
WORK_BRANCH=$(git branch --show-current)
```

### 6. Cambiar a main

```bash
git checkout main
git status
```

Verificar que no hay conflictos ni cambios colgantes en main antes de continuar.

### 7. Hacer el merge

```bash
git merge "$WORK_BRANCH" --no-ff -m "$(cat <<'EOF'
Merge branch '$WORK_BRANCH' into main

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Si el merge genera conflictos:
- Listar los archivos en conflicto con `git diff --name-only --diff-filter=U`
- **Detener el proceso** y reportar al usuario exactamente qué archivos tienen conflictos
- No intentar resolver conflictos automáticamente

### 8. Mostrar resumen final

```bash
git log --oneline -6
git status
```

Imprimir al usuario:

```
✅ Listo para push

Rama de trabajo : {WORK_BRANCH}
Merge en        : main
Último commit   : {hash} {mensaje}

Para publicar los cambios:
  git push origin main

⚠️  No se ha hecho push. El push queda a tu cargo.
```

## Reglas de seguridad

- NUNCA hacer push (ni `git push`, ni `git push origin main`, ni ninguna variante)
- NUNCA usar `--force` en ningún comando git
- NUNCA hacer `git reset --hard` ni `git clean -f`
- NUNCA hacer commit de archivos `.env`, credenciales o secretos
- Si hay conflictos en el merge → detener y reportar, no resolver automáticamente
- Si la rama actual ya es `main` → advertir al usuario y preguntar cómo proceder
