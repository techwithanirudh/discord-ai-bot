# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       curl git sudo python3 python3-pip make \
  && rm -rf /var/lib/apt/lists/*

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
COPY package.json bun.lock* ./
RUN bun install --production --ignore-scripts --frozen-lockfile

# copy production dependencies and source code into final image
FROM base AS release
WORKDIR /usr/src/app

# copy node_modules from temp directory
COPY --from=install /usr/src/app/node_modules ./node_modules

# then copy all (non-ignored) project files into the image
COPY . .
RUN mkdir -p logs

CMD ["bun", "run", "start"]