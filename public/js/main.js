var socket;

var camera, scene, renderer, controls;

var objects = [];
var players = {};
var username = '';

var raycaster;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();

function removeForm() {
  const element = document.getElementById('js-form');
  element.remove();
}

function addInstructions() {
  const element = document.getElementById('instructions');
  element.classList.remove('hidden');
}

(function captureUserData() {
  const form = document.getElementById('js-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.getElementsByTagName('input')[0];
    if (input.value.length >= 2 && input.value.length < 25) {
      username = input.value;
      socket= io.connect('/');
      addInstructions();
      removeForm();

      init();
      animate();
    }
  })

})();


function init() {

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xffffff );
  scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

  var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
  light.position.set( 0.5, 1, 0.75 );
  scene.add( light );

  controls = new THREE.PointerLockControls( camera );

  var blocker = document.getElementById( 'blocker' );
  var instructions = document.getElementById( 'instructions' );

  instructions.addEventListener( 'click', function () {

    controls.lock();

  }, false );

  controls.addEventListener( 'lock', function () {

    blocker.style.display = 'none';
    instructions.style.display = 'none';

  } );

  controls.addEventListener( 'unlock', function () {

    blocker.style.display = 'block';
    instructions.style.display = '';

  } );

  scene.add( controls.getObject() );

  var onKeyDown = function ( event ) {

    switch ( event.keyCode ) {

      case 38: // up
      case 87: // w
        moveForward = true;
        break;

      case 37: // left
      case 65: // a
        moveLeft = true;
        break;

      case 40: // down
      case 83: // s
        moveBackward = true;
        break;

      case 39: // right
      case 68: // d
        moveRight = true;
        break;

      case 32: // space
        if ( canJump === true ) velocity.y += 350;
        canJump = false;
        break;

    }

  };

  var onKeyUp = function ( event ) {

    switch ( event.keyCode ) {

      case 38: // up
      case 87: // w
        moveForward = false;
        break;

      case 37: // left
      case 65: // a
        moveLeft = false;
        break;

      case 40: // down
      case 83: // s
        moveBackward = false;
        break;

      case 39: // right
      case 68: // d
        moveRight = false;
        break;

    }

  };

  document.addEventListener( 'keydown', onKeyDown, false );
  document.addEventListener( 'keyup', onKeyUp, false );

  raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

  // floor

  var floorGeometry = new THREE.PlaneBufferGeometry( 2000, 2000, 100, 100 );
  floorGeometry.rotateX( - Math.PI / 2 );

  // vertex displacement

  var position = floorGeometry.attributes.position;

  for ( var i = 0, l = position.count; i < l; i ++ ) {

    vertex.fromBufferAttribute( position, i );

    vertex.x += Math.random() * 20 - 10;
    vertex.y += Math.random() * 2;
    vertex.z += Math.random() * 20 - 10;

    position.setXYZ( i, vertex.x, vertex.y, vertex.z );

  }


  floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

  position = floorGeometry.attributes.position;
  var colors = [];

  for ( var i = 0, l = position.count; i < l; i ++ ) {

    color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
    colors.push( color.r, color.g, color.b );

  }

  floorGeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

  var floorMaterial = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );

  var floor = new THREE.Mesh( floorGeometry, floorMaterial );
  scene.add( floor );

  // objects

  var boxGeometry = new THREE.BoxBufferGeometry( 20, 20, 20 );
  boxGeometry = boxGeometry.toNonIndexed(); // ensure each face has unique vertices

  position = boxGeometry.attributes.position;
  colors = [];

  for ( var i = 0, l = position.count; i < l; i ++ ) {

    color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
    colors.push( color.r, color.g, color.b );

  }

  boxGeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

  for ( var i = 0; i < 500; i ++ ) {


    var boxMaterial = new THREE.MeshPhongMaterial( { specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors } );
    boxMaterial.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

    var box = new THREE.Mesh( boxGeometry, boxMaterial );
    box.position.x = boxes[i].x;
    box.position.y = boxes[i].y;
    box.position.z = boxes[i].z;

    scene.add( box );
    objects.push( box );
  }


  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  window.addEventListener( 'resize', onWindowResize, false );

  function addPlayer(data) {
    var geometry = new THREE.SphereGeometry( 5, 32, 32 );

    var randomColor = "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
    var material = new THREE.MeshBasicMaterial( {color: randomColor} );
    var sphere = new THREE.Mesh( geometry, material );

    sphere.name = players[data.id];
    sphere.position.x = data.x;
    sphere.position.y = data.y;
    sphere.position.z = data.z;

    scene.add( sphere );
    objects.push( sphere );
  }

  function movePlayer(data) {
    const obj = scene.getObjectByName(players[data.id]);
    obj.position.set(data.x, data.y, data.z);
    const objName = scene.getObjectByName(players[data.id + 'name']);

    objName.position.set(data.x, data.y, data.z);
  }

  socket.on('heard-movement', function (data) {
    if (!players[data.id]) {
      players[data.id] = data.id;
      addPlayer(data);
    } else {
      movePlayer(data);
    }
  });

  socket.emit('user-joined', { username })

  socket.on('heard-username', function (data) {
    new Noty({
      text: data.username + ' joined the game. ' + data.totalPlayers + ' people online.',
      timeout: 2000,
    }).show();
  });


}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

var throttledSocket = _.throttle(function() {
  socket.emit('movement', controls.getObject().position)
}, 0);

function animate() {
  requestAnimationFrame( animate );

  if ( controls.isLocked === true ) {

    raycaster.ray.origin.copy( controls.getObject().position );
    raycaster.ray.origin.y -= 10;

    var intersections = raycaster.intersectObjects( objects );

    var onObject = intersections.length > 0;

    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number( moveForward ) - Number( moveBackward );
    direction.x = Number( moveLeft ) - Number( moveRight );
    direction.normalize(); // this ensures consistent movements in all directions

    if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
    if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

    if ( onObject === true ) {

      velocity.y = Math.max( 0, velocity.y );
      canJump = true;

    }

    controls.getObject().translateX( velocity.x * delta );
    controls.getObject().translateY( velocity.y * delta );
    controls.getObject().translateZ( velocity.z * delta );

    throttledSocket();

    if ( controls.getObject().position.y < 10 ) {

      velocity.y = 0;
      controls.getObject().position.y = 10;

      canJump = true;

    }

    prevTime = time;

  }

  renderer.render( scene, camera );

}