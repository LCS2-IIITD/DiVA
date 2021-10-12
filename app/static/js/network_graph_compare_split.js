let width = window.innerWidth/2;
let viz_width = width;
let height = window.innerHeight;
let computed = false;

let fov = 40;
let near = 400;
let far = 50000;

// Set up camera and scene
let camera_1 = new THREE.PerspectiveCamera(
  fov,
  width / height,
  near,
  far 
);

let camera_2 = new THREE.PerspectiveCamera(
  fov,
  width / height,
  near,
  far 
);

window.addEventListener('resize', () => {
  width = window.innerWidth/2;
  viz_width = width;
  height = window.innerHeight;

  renderer_1.setSize(width, height);
  camera_1.aspect = width / height;
  camera_1.updateProjectionMatrix();

  renderer_2.setSize(width, height);
  camera_2.aspect = width / height;
  camera_2.updateProjectionMatrix();
})

// Add canvas
let container_1 = document.getElementById('graph-view-inner-1')
let container_2 = document.getElementById('graph-view-inner-2')
let renderer_1 = new THREE.WebGLRenderer();
renderer_1.setSize(width, height);
container_1.appendChild(renderer_1.domElement);

let renderer_2 = new THREE.WebGLRenderer();
renderer_2.setSize(width, height);
container_2.appendChild(renderer_2.domElement);
// container_2.appendChild(renderer.domElement);
// container_2.appendChild(renderer.domElement);

let zoom_1 = d3.zoom()
  .scaleExtent([getScaleFromZ(far), getScaleFromZ(near)])
  .on('zoom', () =>  {
    let d3_transform = d3.event.transform;
    zoomHandler(d3_transform, camera_1);
  });

let zoom_2 = d3.zoom()
  .scaleExtent([getScaleFromZ(far), getScaleFromZ(near)])
  .on('zoom', () =>  {
    let d3_transform = d3.event.transform;
    zoomHandler(d3_transform, camera_2);
  });

let view_1 = d3.select(renderer_1.domElement);
let view_2 = d3.select(renderer_2.domElement);
function setUpZoom() {
  view_1.call(zoom_1);    
  let initial_scale_1 = getScaleFromZ(far/4);
  var initial_transform_1 = d3.zoomIdentity.translate(viz_width/2, height/2).scale(initial_scale_1);    
  zoom_1.transform(view_1, initial_transform_1);
  camera_1.position.set(0, 0, far/4);
  view_2.call(zoom_2);    
  let initial_scale_2 = getScaleFromZ(far/4);
  var initial_transform_2 = d3.zoomIdentity.translate(viz_width/2, height/2).scale(initial_scale_2);    
  zoom_2.transform(view_2, initial_transform_2);
  camera_2.position.set(0, 0, far/4);
}
setUpZoom();

let circle_sprite= new THREE.TextureLoader().load(
  "https://fastforwardlabs.github.io/visualization_assets/circle-sprite.png"
)

// var data = {}
// data.nodes = []
// data.links = []
let max_x = 0;
let max_y = 0;
let scene_1 = new THREE.Scene();
let points_1;
let lines_1;
let scene_2 = new THREE.Scene();
let points_2;
let lines_2;
let max_degree;
let chroma_colors;
let diffusion_running = false;
let diffusion_interval_1;
let diffusion_interval_2;
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
    console.log(data)
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
    console.log(data)
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
    let pointsGeometry_1 = new THREE.Geometry();
    let linesGeometry_1 = new THREE.Geometry();
    let pointsMaterial_1 = new THREE.PointsMaterial({
      size: 10,
      sizeAttenuation: false,
      vertexColors: THREE.VertexColors,
      map: circle_sprite,
      transparent: true
    });
    let linesMaterial_1 = new THREE.LineBasicMaterial({
      color: 0xcfcfcf
    });
    let pointsGeometry_2 = new THREE.Geometry();
    let linesGeometry_2 = new THREE.Geometry();
    let pointsMaterial_2 = new THREE.PointsMaterial({
      size: 10,
      sizeAttenuation: false,
      vertexColors: THREE.VertexColors,
      map: circle_sprite,
      transparent: true
    });
    let linesMaterial_2 = new THREE.LineBasicMaterial({
      color: 0xcfcfcf
    });
    let colors_1 = [];
    let colors_2 = [];
    let ref = {}
    ref.x = data.nodes[0].x
    ref.y = data.nodes[0].y;

    data.nodes.map( function(d){
      let vertex = new THREE.Vector3(d.x-ref.x,d.y-ref.y,0);
      pointsGeometry_1.vertices.push(vertex);
      pointsGeometry_2.vertices.push(vertex);
      let color = new THREE.Color(chroma_colors[d.degree-1]);
      colors_1.push(color)
      colors_2.push(color)
    })

    for(let i=0; i<data.links.length; i++){
      let sourceVertex = new THREE.Vector3(data.links[i].source.x-ref.x,data.links[i].source.y-ref.y,0)
      linesGeometry_1.vertices.push(sourceVertex);
      linesGeometry_2.vertices.push(sourceVertex);
      let targetVertex = new THREE.Vector3(data.links[i].target.x-ref.x,data.links[i].target.y-ref.y,0)
      linesGeometry_1.vertices.push(targetVertex);
      linesGeometry_2.vertices.push(targetVertex);
    }

    pointsGeometry_1.colors = colors_1;
    pointsGeometry_2.colors = colors_2;
    
    points_1 = new THREE.Points(pointsGeometry_1, pointsMaterial_1);
    lines_1 = new THREE.LineSegments(linesGeometry_1, linesMaterial_1);
    points_2 = new THREE.Points(pointsGeometry_2, pointsMaterial_2);
    lines_2 = new THREE.LineSegments(linesGeometry_2, linesMaterial_2);

    scene_1.add(points_1);
    scene_1.add(lines_1);
    scene_1.background = new THREE.Color(0xffffff);
    scene_2.add(points_2);
    scene_2.add(lines_2);
    scene_2.background = new THREE.Color(0xffffff);
    animate();

    function showIteration1Num(keys,i){
      setTimeout(function(){
        keys.map( function(key){
            iterations1[key][i].map( function(node){
              points_1.geometry.colors[parseInt(node)] = new THREE.Color(color_array_1[parseInt(key)])
            })
            points_1.geometry.colorsNeedUpdate = true;
          });
          console.log(i)
      },1000*i)
    }

    function showIteration2Num(keys, i){
      setTimeout(function(){
        keys.map( function(key){
            iterations2[key][i].map( function(node){
              points_2.geometry.colors[parseInt(node)] = new THREE.Color(color_array_2[parseInt(key)])
            })
            points_2.geometry.colorsNeedUpdate = true;
          });
          console.log(i)
          getDiffusionData(i)
      },1000*i)
    }

    document.getElementById("start-diffusion").addEventListener("click", function() {
      diffusion_running = ! diffusion_running;
      if(iterations1 === undefined || iterations2 === undefined){
        alert("Please run an algorithm first.")
      }
      else if(diffusion_running){
        let keys1 = Object.keys(iterations1)
        let keys2 = Object.keys(iterations2)
        let num_iters = iterations1[keys1[0]].length
        // for(let i = 0; i < num_iters; i++){
        //   showIteration1Num(keys1,i)
        //   showIteration2Num(keys2,i)
        // }
        let i = parseInt(document.getElementById("myBar").value);
        diffusion_interval_1 = setInterval(function(){
          keys1.map( function(key){
              iterations1[key][i].map( function(node){
                points_1.geometry.colors[parseInt(node)] = new THREE.Color(color_array_1[parseInt(key)])
              })
              points_1.geometry.colorsNeedUpdate = true;
            });
        },1000)
        diffusion_interval_2 = setInterval(function(){
          keys2.map( function(key){
              iterations2[key][i].map( function(node){
                points_2.geometry.colors[parseInt(node)] = new THREE.Color(color_array_2[parseInt(key)])
              })
              points_2.geometry.colorsNeedUpdate = true;
            });
            getDiffusionData(i)
            i++;
        },1000)
      }
      else if(diffusion_interval_1 !== undefined && diffusion_interval_2 !== undefined){
        window.clearInterval(diffusion_interval_1);
        window.clearInterval(diffusion_interval_2);
      }
    });

    document.getElementById('myBar').addEventListener("input", function() {
      if(iterations1 === undefined || iterations2 === undefined){
        alert("Please run an algorithm first.")
      }
      else if(!diffusion_running){
        let final_pos = document.getElementById('myBar').value;
        let keys1 = Object.keys(iterations1)
        let keys2 = Object.keys(iterations2)
        let num_iters = iterations1[keys1[0]].length - 1;
        final_pos = (final_pos>num_iters)?num_iters:final_pos;
        for(let i = 0; i<=final_pos; i++){
          keys1.map(function(key){
            iterations1[key][i].map(function(node){
              points_1.geometry.colors[parseInt(node)] = new THREE.Color(color_array_1[parseInt(key)]);
            });
          });
          keys2.map(function(key){
            iterations2[key][i].map(function(node){
              points_2.geometry.colors[parseInt(node)] = new THREE.Color(color_array_2[parseInt(key)]);
            });
          });
        }
        points_1.geometry.colorsNeedUpdate = true;
        points_2.geometry.colorsNeedUpdate = true;
      }
      else{
        alert("Please pause first.");
      }
    });

    document.getElementById("edge_color_compare").addEventListener("change", function(){
        let x = document.getElementById("edge_color_compare").value;
        lines_1.material.color = new THREE.Color(x)
        lines_1.material.needsUpdate = true
        lines_2.material.color = new THREE.Color(x)
        lines_2.material.needsUpdate = true
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

if(positioned===false){
  streamingNodeLoaderWorker.postMessage(filename);
}
else{
  data.nodes.map(function(d){
    max_degree = (max_degree>parseInt(d.degree))?max_degree:parseInt(d.degree);
  })
  chroma_colors = chroma.scale([chroma('#000088').brighten(3).hex(), '#000088']).mode('lch').colors(max_degree);
  ended()
}

// streamingNodeLoaderWorker.postMessage(filename);

// Three.js render loop
function animate() {
  requestAnimationFrame(animate);
  renderer_1.render(scene_1, camera_1);
  renderer_2.render(scene_2, camera_2);
}

function zoomHandler(d3_transform, camera) {
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