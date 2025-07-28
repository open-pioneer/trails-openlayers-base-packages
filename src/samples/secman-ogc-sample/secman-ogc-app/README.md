# Security.Manager OGC + Identity Service Demo

A prototype for the integration of Open Pioneer Trails with Security.Manager OGC and the Identity Service.
Keycloak is used as the authentication Backend.

## Setup

1.  Add an entry to your `hosts` file:

    ```text
    127.0.0.1 mylocalhost
    ```

    This is needed for the docker containers to talk to each other.

2.  Run `docker compose up` from the `setup` directory.
    Additional authentication against the container registry may be necessary.

    > NOTE: The containers require local ports `8080`, `8081` and `8082`.

4.  Run dev mode from this repository's root directory:

    ```bash
    $ pnpm install
    $ pnpm dev
    ```

    Open the trails app at <http://localhost:5173/samples/secman-ogc-sample/>.

    > NOTE: Port 5173 must be used. Vite will automatically use another port if the port is already taken, which would not work with this configuration.

### Credentials

The following credentials can be used when logging into the web application (realm `trails`):

    trails_test_user / test

The Keycloak administrator account uses `admin / admin` (realm `master`).

### How it works

- The trails application is configured for authentication against the Keycloak instance at `mylocalhost:8080` (see hardcoded values in `app.ts`).
- Users of the web application are required to be authenticated (for simplicity, via `<ForceAuth />`).
  This way a valid token is always available.
- When requests are made against the secured service (hardcoded as `http://mylocalhost:8082`), the current token will be appended automatically.
  See `services/TokenInterceptor.ts`.
- Behind the scenes, the secured service (sec.man OGC) will validate the passed token using the Identity Service, which is also configured to use Keycloak as its backend.

### Notes

#### Prototype

The implementation uses ad-hoc methods to pass the token to the secured service.
Real ct-identity integration would parse the token rules from the Identity Service and would automatically send token(s) to hosts that require them.
Better integration of security.manager OGC would perform health checks / permission checks to determine whether the user can actually see a layer.

#### Creating keycloak export

Inside the docker container (e.g. `docker exec -it keycloak /bin/bash`):

```bash
cd /opt/keycloak/bin/

# copy h2 db, otherwise it is locked
cp -rp /opt/keycloak/data/h2 /tmp

# export realm embed users in realm.json
./kc.sh export --dir /tmp/kc-export --realm trails --users realm_file --db dev-file --db-url 'jdbc:h2:file:/tmp/h2/keycloakdb;NON_KEYWORDS=VALUE'
```

Outside the docker container:

```bash
# copy from container to local fs
docker cp keycloak:/tmp/kc-export/trails-realm.json trails-realm.json
```
