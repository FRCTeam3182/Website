# Website
The official team website at team3182.org

####How does this work?
When someone commits a change to the website, they commit to the branch `gh-pages`. This gives the team the ability to view the change on the beta URL `http://frcteam3182.github.io/Website/`. When people approve the change, we merge the change into the `master` branch. Then, an automatic script detects that a change has been made to the `master` branch, and automatically deploys it to the team server. This will make the change live. 
