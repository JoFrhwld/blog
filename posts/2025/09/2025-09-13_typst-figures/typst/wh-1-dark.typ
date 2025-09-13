#import "@preview/fletcher:0.5.8" as fletcher: (
  diagram, 
  node, 
  edge
)
#set page(
  width: auto,
  height: auto, 
  margin: 5mm, 
  fill: rgb("#222")
)
#set text(
  fill: white
)

#let nodes = ("Who", "What", "When", "Where", "Why")
#let edges = (
  (3,0),
  (0,2),
  (2,4),
  (4,1),
  (1,3),
  (0,1),
  (1,2),
  (2,3),
  (3,4),
  (4,0)
)

#diagram({
  for (i, n) in nodes.enumerate() {
    let θ = 90deg - i*360deg/nodes.len()
    node((θ, 30mm), 
      n, 
      stroke: 0.5pt+white, 
      name: str(i),
      shape: circle
    )
  }
  for (from, to) in edges {
    edge(
      label(str(from)),
      label(str(to)),
      "-|>",
      stroke: 1.2pt+white,
      bend: 10deg
    )
  }
})