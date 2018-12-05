import { PullRequestsCreateResponse, PullRequestsGetFilesResponseItem } from '@octokit/rest'
import { Application } from 'probot' // eslint-disable-line no-unused-vars
import { PartialSwagger, SwaggerPathScraper } from './github/SwaggerPathScraper'

export = (app: Application) => {
  app.log('app loaded')
  const swaggerPathScraper = new SwaggerPathScraper()
  let hasMultiVersions = false
  app.on(['pull_request.opened', 'pull_request.reopened'], async context => {
    const prContent = context.payload.pull_request as PullRequestsCreateResponse

    if (prContent !== null) {
      app.log(
        `PR opened/reopened for PR ${prContent.number} on repo ${prContent.head.repo.owner.login}/${
          prContent.head.repo.name
        }`
      )
      const prFiles = await context.github.pullRequests.getFiles({
        number: prContent.number,
        owner: prContent.head.repo.owner.login,
        repo: prContent.head.repo.name
      })
      hasMultiVersions = checkForMultiVersions(prFiles.data)
    }

    if (prContent.base.ref === 'master' && !hasMultiVersions) {
      app.log('PR against master')
      const prFromOwnerRepo = prContent.head.repo.full_name
      const prFromRef = encodeURIComponent(prContent.head.ref)
      app.log(`repo: ${prFromOwnerRepo}, branch: ${prFromRef}`)
      const prComment = context.issue({
        body: `If you're a MSFT employee, click [this link](https://portal.azure-devex-tools.com/app/branch/${prFromOwnerRepo}/${prFromRef}?source=github)
      to view this PR's validation status on our new OpenAPI Hub spec management tool.`
      })
      await context.github.issues.createComment(prComment)
    }
  })

  const checkForMultiVersions = (entries: PullRequestsGetFilesResponseItem[]): boolean => {
    app.log('getting files')
    let firstVersion: PartialSwagger
    let hasMulti: boolean = false
    entries.forEach(element => {
      app.log(`file found for path: ${element.contents_url}`)
      const partialSwagger = swaggerPathScraper.parsePathToSwagger(element.contents_url)
      if (partialSwagger !== undefined) {
        if (firstVersion !== undefined) {
          if (
            partialSwagger.rpName !== firstVersion.rpName ||
            partialSwagger.version !==
            firstVersion.version
          ) {
            hasMulti = true
          }
        } else {
          firstVersion = partialSwagger
        }
        app.log(
          `swagger file found for version: ${partialSwagger.version} name: ${partialSwagger.rpName}`
        )
      }
    })
    return hasMulti
  }

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
