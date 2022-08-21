let width = window.innerWidth;
let viz_width = width;
let height = window.innerHeight/2;
let computed = false;

let fov = 40;
let near = 400;
let far = 50000;

// Set up camera and scene
let camera = new THREE.PerspectiveCamera(
  fov,
  width / height,
  near,
  far 
);

window.addEventListener('resize', () => {
  width = window.innerWidth;
  viz_width = width;
  height = window.innerHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
})

// Add canvas
let container = document.getElementById('graph-view-inner-1')
// let container_2 = document.getElementById('graph-view-inner-2')
let renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
container.appendChild(renderer.domElement);
// container_2.appendChild(renderer.domElement);
// container_2.appendChild(renderer.domElement);

let zoom = d3.zoom()
  .scaleExtent([getScaleFromZ(far), getScaleFromZ(near)])
  .on('zoom', () =>  {
    let d3_transform = d3.event.transform;
    zoomHandler(d3_transform);
  });

let view = d3.select(renderer.domElement);
function setUpZoom() {
  view.call(zoom);    
  let initial_scale = getScaleFromZ(far/4);
  var initial_transform = d3.zoomIdentity.translate(viz_width/2, height/2).scale(initial_scale);    
  zoom.transform(view, initial_transform);
  camera.position.set(0, 0, far/4);
}
setUpZoom();

let circle_sprite= new THREE.TextureLoader().load(
  "https://fastforwardlabs.github.io/visualization_assets/circle-sprite.png"
)

var data = {}
data.nodes = []
data.links = []
let max_x = 0;
let max_y = 0;
let scene = new THREE.Scene();
let points;
let lines;
let max_degree;
let chroma_colors;
let x = 0
const streamingNodeLoaderWorker = new Worker("static/js/streaming-csv-parser.js");

streamingNodeLoaderWorker.onmessage = ({
    data: { items, totalBytes, finished }
}) => {
  // const node = items
  //   .map(d => ({
  //     id: d.id,
  //     x: 0,
  //     y: 0,
  //   }))
  // items.map( function(d){
  //   max_degree = d.max_degree
  //   chroma_colors = chroma.scale(['#8282ff','#000088']).mode('lch').colors(max_degree);
  // })
  // data.nodes = data.nodes.concat(node)
  const nodes = items.map(function(d){
    let node_to_return = { id: d.id, x:0, y:0, degree: parseInt(d.degree) }
    max_degree = (max_degree>parseInt(d.degree))?max_degree:parseInt(d.degree);
    let out_edges = d.edges.split(" ")
    out_edges.map(function(e){
      if(e===''){
        // Do nothing
      }
      else{
        data.links.push({ source: d.id, target: e })
      }
    })
    return node_to_return
  })
  data.nodes = data.nodes.concat(nodes)
  if (finished) {
    chroma_colors = chroma.scale([chroma('#000088').brighten(3).hex(), '#000088']).mode('lch').colors(max_degree);
    d3.forceSimulation(data.nodes)
      .force("boundary", forceBoundary(0,0,250000,100000).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("link", d3.forceLink(data.links).id(function(d){ return d.id }).distance(50))
      .on('tick', ticked)
      .on('end', ended);
  }
};

function ticked() {}

function ended(){
    data.nodes.map( function(node){
      if(node.x > max_x){
        max_x = node.x;
      }
      else if(-node.x > max_x){
        max_x = -node.x;
      }

      if(node.y > max_y){
        max_y = node.y;
      }
      else if(-node.y > max_y){
        max_y = -node.y
      }
    })
    let pointsGeometry = new THREE.Geometry();
    let linesGeometry = new THREE.Geometry();
    let pointsMaterial = new THREE.PointsMaterial({
      size: 10,
      sizeAttenuation: false,
      vertexColors: THREE.VertexColors,
      map: circle_sprite,
      transparent: true
    });
    let linesMaterial = new THREE.LineBasicMaterial({
      color: 0xcfcfcf
    });
    let colors = [];
    let ref = {}
    ref.x = data.nodes[0].x
    ref.y = data.nodes[0].y;

    data.nodes.map( function(d){
      let vertex = new THREE.Vector3(d.x-ref.x,d.y-ref.y,0);
      pointsGeometry.vertices.push(vertex);
      let color = new THREE.Color(chroma_colors[d.degree-1]);
      colors.push(color)
    })

    for(let i=0; i<data.links.length; i++){
      let sourceVertex = new THREE.Vector3(data.links[i].source.x-ref.x,data.links[i].source.y-ref.y,0)
      linesGeometry.vertices.push(sourceVertex);
      let targetVertex = new THREE.Vector3(data.links[i].target.x-ref.x,data.links[i].target.y-ref.y,0)
      linesGeometry.vertices.push(targetVertex);
    }

    pointsGeometry.colors = colors;
    
    points = new THREE.Points(pointsGeometry, pointsMaterial);
    lines = new THREE.LineSegments(linesGeometry, linesMaterial);

    scene.add(points);
    scene.add(lines);
    scene.background = new THREE.Color(0xffffff);
    animate();

    function showIteration1Num(keys,i){
      setTimeout(function(){
        keys.map( function(key){
            iterations1[key][i].map( function(node){
              points.geometry.colors[parseInt(node)] = new THREE.Color(color_array_1[parseInt(key)])
            })
            points.geometry.colorsNeedUpdate = true;
          });
          console.log(i)
      },1000*i)
    }

    function showIteration2Num(keys, i){
      setTimeout(function(){
        keys.map( function(key){
            iterations2[key][i].map( function(node){
              points.geometry.colors[parseInt(node)] = new THREE.Color(color_array_2[parseInt(key)])
            })
            points.geometry.colorsNeedUpdate = true;
          });
          console.log(i)
      },1000*i)
    }

    document.getElementById("start-diffusion").addEventListener("click", function() {
      if(iterations1 === undefined || iterations2 === undefined){
        alert("Please run an algorithm first.")
      }
      else{
        let keys1 = Object.keys(iterations1)
        let keys2 = Object.keys(iterations2)
        let num_iters = iterations1[keys1[0]].length
        for(let i = 0; i < num_iters; i++){
          showIteration1Num(keys1,i)
          showIteration2Num(keys2,i)
        }
      }
    });

    document.getElementById("edge_color_compare").addEventListener("change", function(){
        let x = document.getElementById("edge_color_compare").value;
        lines.material.color = new THREE.Color(x)
        lines.material.needsUpdate = true
    })

    // console.log(points.geometry)
    // let raycaster = new THREE.Raycaster();
    // raycaster.params.Points.threshold = 500;

    // view.on("mousemove", () => {
    //   let [mouseX, mouseY] = d3.mouse(view.node());
    //   let mouse_position = [mouseX, mouseY];
    //   checkIntersects(mouse_position);
    // });

    // function mouseToThree(mouseX, mouseY) {
    //   return new THREE.Vector3(
    //     (mouseX / viz_width * 2 - 1),
    //     (-(mouseY / height) * 2 + 1),
    //     1
    //   );
    // }

    // function checkIntersects(mouse_position) {
    //   let mouse_vector = mouseToThree(...mouse_position);
    //   raycaster.setFromCamera(mouse_vector, camera);
    //   let intersects = raycaster.intersectObject(points);
    //   if (intersects[0]) {
    //     let sorted_intersects = sortIntersectsByDistanceToRay(intersects);
    //     let intersect = sorted_intersects[0];
    //     let index = intersect.index;
    //     let datum = data.nodes[index];
    //     highlightPoint(datum);
    //     showTooltip(mouse_position, datum);
    //   } else {
    //     removeHighlights();
    //     hideTooltip();
    //   }
    // }

    // function sortIntersectsByDistanceToRay(intersects) {
    //   return _.sortBy(intersects, "distanceToRay");
    // }

    // let hoverContainer = new THREE.Object3D()
    // scene.add(hoverContainer);

    // function highlightPoint(datum) {
    //   removeHighlights();
    //   let geometry = new THREE.Geometry();
    //   geometry.vertices.push(
    //     new THREE.Vector3(
    //       datum.x,
    //       datum.y,
    //       0
    //     )
    //   );
    //   geometry.colors = [ new THREE.Color(color_array[5]) ];

    //   let material = new THREE.PointsMaterial({
    //     size: 26,
    //     sizeAttenuation: false,
    //     vertexColors: THREE.VertexColors,
    //     map: circle_sprite,
    //     transparent: true
    //   });
      
    //   let point = new THREE.Points(geometry, material);
    //   hoverContainer.add(point);
    // }

    // function removeHighlights() {
    //   hoverContainer.remove(...hoverContainer.children);
    // }

    // view.on("mouseleave", () => {
    //   removeHighlights()
    // });

    // // Initial tooltip state
    // let tooltip_state = { display: "none" }

    // let tooltip_template = document.createRange().createContextualFragment(`<div id="tooltip" style="display: none; position: absolute; pointer-events: none; font-size: 13px; width: 120px; text-align: center; line-height: 1; padding: 6px; background: white; font-family: sans-serif;">
    //   <div id="point_tip" style="padding: 4px; margin-bottom: 4px;"></div>
    //   <div id="group_tip" style="padding: 4px;"></div>
    // </div>`);
    // document.body.append(tooltip_template);

    // let $tooltip = document.querySelector('#tooltip');
    // let $point_tip = document.querySelector('#point_tip');
    // let $group_tip = document.querySelector('#group_tip');

    // function updateTooltip() {
    //   $tooltip.style.display = tooltip_state.display;
    //   $tooltip.style.left = tooltip_state.left + 'px';
    //   $tooltip.style.top = tooltip_state.top + 'px';
    //   $point_tip.innerText = tooltip_state.name;
    //   $point_tip.style.background = color_array[tooltip_state.group];
    //   $group_tip.innerText = `Size ${tooltip_state.group}`;
    // }

    // function showTooltip(mouse_position, datum) {
    //   let tooltip_width = 120;
    //   let x_offset = -tooltip_width/2;
    //   let y_offset = 30;
    //   tooltip_state.display = "block";
    //   tooltip_state.left = mouse_position[0] + x_offset;
    //   tooltip_state.top = mouse_position[1] + y_offset;
    //   tooltip_state.name = datum.id;
    //   tooltip_state.group = datum.size;
    //   updateTooltip();
    // }

    // function hideTooltip() {
    //   tooltip_state.display = "none";
    //   updateTooltip();
    // }
}

streamingNodeLoaderWorker.postMessage("data.csv");

// Three.js render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function zoomHandler(d3_transform) {
  let scale = d3_transform.k;
  let x = -(d3_transform.x - viz_width/2) / scale;
  let y = (d3_transform.y - height/2) / scale;
  let z = getZFromScale(scale);
  camera.position.set(x, y, z);
}

function getScaleFromZ (camera_z_position) {
  let half_fov = fov/2;
  let half_fov_radians = toRadians(half_fov);
  let half_fov_height = Math.tan(half_fov_radians) * camera_z_position;
  let fov_height = half_fov_height * 2;
  let scale = height / fov_height; // Divide visualization height by height derived from field of view
  return scale;
}

function getZFromScale(scale) {
  let half_fov = fov/2;
  let half_fov_radians = toRadians(half_fov);
  let scale_height = height / scale;
  let camera_z_position = scale_height / (2 * Math.tan(half_fov_radians));
  return camera_z_position;
}

function toRadians (angle) {
  return angle * (Math.PI / 180);
}