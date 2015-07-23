Old Branches
=============


Finds all the branches that are old and are already merged into main repo. This is useful for pruning old branches that will no longer be useful or impossible to merge

To run 


`node index.js ~/code/seam 6 origin/beta`


This will find all the branches that are older than 6 months and/or have been merged into beta branch.

The merged branches can definitely be pruned, but the older branches can also be pruned because they would be impossible to merge back.
