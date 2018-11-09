import { Application } from "probot"; // eslint-disable-line no-unused-vars

import { PullRequestsCreateResponse } from "@octokit/rest";

export = (app: Application) => {
  app.log("app loaded");
  app.on(["pull_request.opened", "pull_request.reopened"], async context => {
    const prContent = context.payload
      .pull_request as PullRequestsCreateResponse;
    app.log("PR opened/reopened");

    const prFromOwnerRepo = prContent.head.repo.full_name;
    const prFromRef = prContent.head.ref;
    app.log(`repo: ${prFromOwnerRepo}, branch: ${prFromRef}`);
    const prComment = context.issue({
      body: `If you're a MSFT employee, click [this link](https://portal.azure-devex-tools.com/app/branch/${prFromOwnerRepo}/${prFromRef}?source=github)
      to view this PR's validation status on our new OpenAPI Hub spec management tool.`
    });
    await context.github.issues.createComment(prComment);
  });
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
