# Code signing setup (SignPath Foundation)

Releases are built by [`.github/workflows/release.yml`](../.github/workflows/release.yml). Signing turns on by itself as soon as the secret and variables below exist. Until then, releases are published unsigned.

## 1. Apply

Apply at <https://signpath.org/apply>. Requirements this project already meets:
- OSI license (MIT), public repository, already released, documented.
- Builds run on GitHub-hosted runners.
- A **Code signing policy** section with team roles and privacy notes is in the [README](../README.md#code-signing-policy).
- The installer shows a privacy notice, and online lookups can be turned off in Settings.

What you must do yourself: enable **two-factor authentication** on GitHub and on SignPath.

## 2. After approval, in SignPath

1. Add the predefined **GitHub.com** trusted build system and link it to the project.
2. Create an **artifact configuration**. The workflow uploads a ZIP containing `GameCenter-Setup-<version>.exe`. Only the installer is signed; the bundled `GameCenter.exe` is Electron's unmodified upstream binary. For example:

   ```xml
   <artifact-configuration xmlns="http://signpath.io/artifact-configuration/v1">
     <zip-file>
       <pe-file path="GameCenter-Setup-*.exe" product-name="GameCenter">
         <authenticode-sign/>
       </pe-file>
     </zip-file>
   </artifact-configuration>
   ```

3. Create a **release signing policy** that requires manual approval.
4. Create an **API token** for a user with submitter permissions.

## 3. In GitHub (Settings → Secrets and variables → Actions)

| Kind | Name | Value |
|---|---|---|
| Secret | `SIGNPATH_API_TOKEN` | the API token |
| Variable | `SIGNPATH_ORGANIZATION_ID` | your SignPath organization ID |
| Variable | `SIGNPATH_PROJECT_SLUG` | the project slug |
| Variable | `SIGNPATH_SIGNING_POLICY_SLUG` | the signing policy slug |

## 4. Release

Bump `version` in `package.json`, commit, then push a matching tag:

```bash
git tag v1.2.0
git push origin v1.2.0
```

The workflow builds the installer, sends it to SignPath, waits for the approval and publishes the signed file on the release page. Approve the request in SignPath when it arrives.

Once signing works, the README line "Until the application is approved, releases are unsigned" can be removed.
