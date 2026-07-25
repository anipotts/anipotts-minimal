
# AP Structural `0.1.0-candidate.1`

Status: `candidate`.

This packet is for localhost visual comparison only. It does not approve a
profile change, deployment, publication, or replacement of Urbanist Black.

Import the packet directory without editing Brand sources. Load
`css/ap-structural.css`, then apply `ap-structural-candidate` only to the
localhost elements under review. The CSS explicitly falls back to Urbanist.

Rollback by removing that stylesheet reference and candidate class, then
confirming the affected element resolves to Urbanist Black again. Removing the
imported packet directory is safe after the stylesheet and class are gone.
