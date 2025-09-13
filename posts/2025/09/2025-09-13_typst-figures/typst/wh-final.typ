#import "@preview/fletcher:0.5.8" as fletcher: (
  diagram, 
  node, 
  edge
)
#set page(
  width: auto,
  height: auto, 
  margin: 5mm, 
  fill: rgb("#393d3b")
)
#set text(
  font: "Macondo Swash Caps",
  size: 30pt
)
#set align(center)

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
#box[
  #set text(size: 0.8em, fill: gradient.linear(
    color.hsv(50deg, 50%, 70%),
    //color.hsv(50deg, 50%, 70%),
    color.hsv(0deg, 100%, 100%, 100%),
    color.hsv(0deg, 100%, 100%, 100%),    
    black,
    angle: 90deg
  ),)
  The interrogation of Bartholemew Durkis
]

#diagram({
  for (i, n) in nodes.enumerate() {
    let θ = 90deg - i*360deg/nodes.len()
    node((θ, 50mm), 
      n, 
      stroke: 0.5pt, 
      name: str(i),
      shape: circle,
     fill:gradient.linear(
        luma(0%, 80%), 
        color.hsv(0deg, 100%, 100%, 70%),        
        color.hsv(0deg, 100%, 100%, 50%), 
      angle: -θ)      
    )
  }
  for (from, to) in edges {
    edge(
      label(str(from)),
      label(str(to)),
      "-|>",
      stroke: color.hsv(50deg, 50%, 70%) + 3pt,
      bend: 10deg,
    )
  }
  node(
    (0deg,0mm), 
    "Y/N", 
    name:"6", 
    shape:circle, 
    stroke:0.5pt,
    fill: color.hsv(0deg, 100%, 100%, 60%)
 ) 
  for(i,m) in nodes.enumerate(){
   edge(
     label("6"),
     label(str(i)),
     "-}>",
     stroke: color.hsv(50deg, 50%, 70%) + 1.5pt,
     bend:10deg
   )
 }
})