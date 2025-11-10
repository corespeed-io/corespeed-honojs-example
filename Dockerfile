FROM denoland/deno:2.5.6

WORKDIR /app

COPY . .

RUN if [ -f .env.example ]; then echo "ERROR: .env.example should not be included in the Docker image" && exit 1; fi

RUN deno cache main.ts

EXPOSE 8000

CMD ["deno", "run", "-A", "main.ts"]