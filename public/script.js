﻿var scene, camera, renderer;
var object, material;
var autoView = false;

var langasId = _( "langas" );
var objectMetadata = [];

main()
viewInit();

function _(el){
  return document.getElementById(el);
}

function main(){
  _("uplId").addEventListener("click", function(){
    var file = _("fileId").files[0];

    if(file == null){
      _("up_info").innerHTML = "No file chosen";
      return;
    }

    var formdata = new FormData();
    formdata.append("file", file);
    var req = new XMLHttpRequest();
    req.upload.addEventListener("progress", function(e){
      var percent = Math.round((e.loaded / e.total) * 100);
      _("up_info").innerHTML = percent + "% uploaded...";
    }, false);

    req.addEventListener("load", function(res){
      if(req.status == 200){
        _("up_info").innerHTML = "Upload done";
        var data = res.target.responseText;
//        console.log(data);

        var blob = new Blob([data], {type: "application/json; charset=utf-8"});
        var url = URL.createObjectURL(blob);
        objectMetadata.push( JSON.parse( data ).metadata.adjust );

        addTabRow(_("tab"), file.name, data.length, url);

        if(autoView){
          loadObject(url, objectMetadata.length - 1);
        }
     } else if(req.status == 500){
       _("up_info").innerHTML = JSON.parse(res.target.responseText).msg;
//       console.log(res.target.responseText);
     }
    }, false);

    req.addEventListener("abort", function(e){
      _("up_info").innerHTML = "Upload Aborted";
      console.log(e);
    }, false);

    req.addEventListener("error", function(e){
      _("up_info").innerHTML = "Upload Failed";
      console.log(e);
    }, false);

    req.open("POST", "/file_upload");
    req.send(formdata);
  }, false);

  buttonControl();

  function addTabRow(table, t_name, t_size, t_blob){
    var r = table.insertRow();

    var arr = [table.rows.length-1, t_name, size(t_size)];
    for (var i = 0; i < arr.length; i++) {
      var c = r.insertCell(i);
      c.appendChild(document.createTextNode(arr[i]));
    }

    var link0 = document.createElement("a");
    link0.appendChild(document.createTextNode(t_blob));
    link0.setAttribute("href", t_blob);
    link0.setAttribute("target", "_blank");

    var link1 = document.createElement("a");
    link1.appendChild(document.createTextNode("link"));
    link1.setAttribute("href", t_blob);
    var i = t_name.lastIndexOf(".");
    link1.setAttribute("download", t_name.substr(0, i)+".json");

    var but = document.createElement("button");
    but.appendChild(document.createTextNode("view"));
    var om = objectMetadata.length - 1;
    but.addEventListener("click", function(){
      _("wi_info").innerHTML = (om + 1) + "# loading...";
      loadObject(t_blob, om);
    });

    var c0 = r.insertCell();
    c0.appendChild(link0);
    var c1 = r.insertCell();
    c1.appendChild(link1);
    var c1 = r.insertCell();
    c1.appendChild(but);

    function size(b){
      if(b < 1024){
        return b + " bytes";
      } else if (b < 1048576) {
        return Math.round((b / 1024) * 1000) / 1000 + " KB";
      } else {
        return Math.round((b / 1048576) * 1000) / 1000 + " MB";
      }
    }
  }
}

function viewInit() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 75, langasId.clientWidth / langasId.clientHeight, 1, 10000 );
  camera.position.x = 500;
	camera.position.y = 500;
	camera.position.z = 500;
	camera.lookAt( scene.position );

  material = new THREE.MeshPhongMaterial({
    color: 0x00a100,
    side: THREE.DoubleSide,
    shading: THREE.FlatShading
  });

	//Plane
	var planeGeometry = new THREE.PlaneGeometry(2000, 2000);
	var planeMaterial = new THREE.MeshPhongMaterial({
		color: 0xdcdcdc,
		shininess: 10
	});
	var plane = new THREE.Mesh(planeGeometry, planeMaterial);
	plane.rotation.x = - Math.PI / 2;
	plane.receiveShadow = true;
	scene.add(plane);

	//GridHelper
	var grid = new THREE.GridHelper(1000, 20, new THREE.Color( 0xa10000 ), new THREE.Color( 0xf0f0f0 ));
	scene.add(grid);

	//Light
	scene.add( addLight( -1414, 1000, 0 ) );
	scene.add( addLight( 1000, 1000, 1000 ) );
	scene.add( addLight( 1000, 1000, -1000 ) );

	renderer = new THREE.WebGLRenderer({ antialias:true });

	renderer.setClearColor( 0xdddddd );
	renderer.shadowMap.enabled = true;
	renderer.shadowMapSoft = true;
  renderer.setSize( langasId.clientWidth, langasId.clientHeight );

	//Mouse controls
	var controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.addEventListener( 'change', render );

	langasId.appendChild( renderer.domElement );

	render();
}

function addLight( pX, pY, pZ ){
	var spotLight = new THREE.SpotLight( 0xffffff );
	spotLight.castShadow = true;
	spotLight.position.set( pX, pY, pZ );

	spotLight.angle = 1;
	spotLight.penumbra = 0.06;
	spotLight.decay = 1;
	spotLight.distance = 4000;
	spotLight.intensity = 0.5;

	spotLight.shadow.mapSize.width = 1024;
	spotLight.shadow.mapSize.height = 1024;
	spotLight.shadow.camera.near = 1;
	spotLight.shadow.camera.far = 200;

	return spotLight;
}

function loadObject(url, metaNr){
	var onProgress = function ( xhr ) {
		if ( xhr.lengthComputable ) {
			var percentComplete = xhr.loaded / xhr.total * 100;
      _("wi_info").innerHTML = (metaNr + 1) + "# " + Math.round(percentComplete, 2) + '% load';
		}
	};

	var onError = function ( xhr ) {
    _("wi_info").innerHTML = (metaNr + 1) + "# 3d view error";
	};

  var d = objectMetadata[metaNr];

  if(object != null){
    scene.remove(object);
  }

	var loader = new THREE.JSONLoader();
	loader.load( url, function ( geometry ) {
		object = new THREE.Mesh( geometry, material );

		object.scale.set( d.scale, d.scale, d.scale );

		object.position.x = d.position.x;
		object.position.y = d.position.y + 1;
		object.position.z = d.position.z;

		object.rotation.x = d.rotation.x;
		object.rotation.y = d.rotation.y;
		object.rotation.z = d.rotation.z;

    object.castShadow = true;

		scene.add( object );

		render();
    _("wi_info").innerHTML = (metaNr + 1) + "# done";
	}, onProgress, onError);
}

function buttonControl() {
  _("col_w").addEventListener("click", function(){
    setColor(0xffffff);
  });
  _("col_r").addEventListener("click", function(){
    setColor(0xff0000);
  });
  _("col_g").addEventListener("click", function(){
    setColor(0x00ff00);
  });
  _("col_b").addEventListener("click", function(){
    setColor(0x0000ff);
  });
  _("col_bl").addEventListener("click", function(){
    setColor(0x000000);
  });

  _("anvId").checked = autoView;
  _("anvId").addEventListener("click", function(){
    autoView = _("anvId").checked;
  });

  if(document.mozFullScreenEnabled){
    document.addEventListener("mozfullscreenchange", onWindowResize);
  } else if(document.webkitFullscreenEnabled) {
    document.addEventListener("webkitfullscreenchange", onWindowResize);
  } else if(document.msFullscreenEnabled) {
    document.addEventListener("MSFullscreenChange", function(){
      var i = 0;
      var loop = setInterval(function(){
        if( i > 10 || (window.screen.width == langasId.clientWidth && window.screen.height == langasId.clientHeight) ){
          clearInterval(loop);
          onWindowResize();
        }
        i++;
      }, 100);
    });
  } else if(document.fullscreenEnabled) {
    document.addEventListener("fullscreenchange", onWindowResize);
  }

  _("fScreen").addEventListener("click", function(){
    var elem = langasId;
    if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    } else if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  });

  function setColor(h) {
    if(object != null){
      object.material.color.setHex(h);
      render();
    }
  }
}

function onWindowResize() {
	camera.aspect = langasId.clientWidth / langasId.clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( langasId.clientWidth, langasId.clientHeight );
	render();
}

function render() {
	renderer.render( scene, camera );
}
