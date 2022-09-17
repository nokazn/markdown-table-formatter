FROM denoland/deno:1.25.2

WORKDIR /app

USER deno

ADD . .

RUN deno cache format.ts format.test.ts
