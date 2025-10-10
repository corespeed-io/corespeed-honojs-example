```
deno task start
```

```
curl -X POST http://127.0.0.1:8000/run-task \
  -H "Content-Type: application/json" \
  -d '{"task": "Hello"}' \
  --no-buffer
```