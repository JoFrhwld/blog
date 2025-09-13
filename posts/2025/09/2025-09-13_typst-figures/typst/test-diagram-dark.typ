// package imports
#import "@preview/fletcher:0.5.8" as fletcher: (
  diagram, 
  node, 
  edge
)

// By default, the page size is A4.
// But since I'm making a standalone diagram,
// I want it to shrink automatically shrink
// to the size of the content.
#set page(
  width: auto,
  height: auto, 
  margin: 5mm, 
  fill: rgb("#222")
)
#set text(
  fill: white
)

// This is a simple array of 
// node labels
#let nodes = ("A", "B", "C")

// This is an array of from-to edges
#let edges = (
  (0,1),
  (1,2),
  (2,0)
)

#diagram({
  for (i, n) in nodes.enumerate() {
    node(
      // Node coordinates
      (i, 0), 
      // node text
      n, 
      // node line
      stroke: 1pt+white, 
      // node id
      name: str(i)
    )
  }
  // argument unpacking
  for (from, to) in edges {
    // typed numeric variables
    let bend = 0deg
    // on the return arrow
    // arc large
    if(to < from){
      bend = 60deg
    }
    edge(
      label(str(from)), 
      label(str(to)), 
      // edge type
      "-|>",
      stroke: white,
      bend: bend
    )
  }
})