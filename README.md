* Using fly.io

```
flyctl launch
flyctl list apps
flyctl logs -a swgoh-discord
fly apps restart swgoh-discord
flyctl secrets list
flyctl deploy -a swgoh-discord
```

> `fly launch` will do the initial deployment for you if you want it to, as long as the build configuration has been set.
> Use `fly deploy` to manually deploy an existing app. 