//three.js 設定
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer({
    antialias: true,                //アンチエイリアス
    alpha: true,                    //透明度
    logarithmicDepthBuffer: true    //z-fighting対策、3Dモデルの服などが正しく表示されないことがあるため
});

//レンダラー設定
renderer.gammaOutput = true;                                //ガンマ補正
renderer.setClearColor(new THREE.Color("black"), 0);        //背景色
renderer.setPixelRatio(window.devicePixelRatio);            //ピクセル比
renderer.setSize(window.innerWidth, window.innerHeight);    //サイズ
renderer.domElement.style.position = "absolute";            //位置は絶対座標
renderer.domElement.style.top = "0px";                      //上端
renderer.domElement.style.left = "0px";                     //左端
document.body.appendChild(renderer.domElement);             //bodyに追加

//カメラ設定
//                                  fov,                                 aspect,zNear, zFar
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1000, 10000);
scene.add(camera);

//光源設定
var light = new THREE.DirectionalLight(0xffffff);     // 平行光源（白）

light.position.set(0, 0, 2);// カメラ方向に配置 (CHECK)
scene.add(light);

//AR設定
//マーカ用のメディアソース設定
var source = new THREEx.ArToolkitSource({
    sourceType: "webcam",
});

source.init(function onReady() {
    // リサイズ処理
    onResize();
});

// ウィンドウサイズが変更された場合も
window.addEventListener("resize", function () {
    // リサイズ処理
    onResize();
});

// リサイズ関数
function onResize() {
    //トラッキングソースとレンダラをリサイズ
    //arControllerもリサイズする
    source.onResizeElement();
    source.copyElementSizeTo(renderer.domElement);
    if (context.arController !== null) {
        source.copyElementSizeTo(context.arController.canvas);
    }
}

//カメラパラメータ、マーカ検出設定
var context = new THREEx.ArToolkitContext({
    debug: false,                                       // デバッグ用キャンバス表示（デフォルトfalse）
    cameraParametersUrl: "assets/markers/camera_para.dat",             // カメラパラメータファイル
    detectionMode: "mono",                              // 検出モード（color/color_and_matrix/mono/mono_and_matrix）
    imageSmoothingEnabled: true,                        // 画像をスムージングするか（デフォルトfalse）
    maxDetectionRate: 60,                               // マーカの検出レート（デフォルト60）
    canvasWidth: source.parameters.sourceWidth,         // マーカ検出用画像の幅（デフォルト640）
    canvasHeight: source.parameters.sourceHeight,       // マーカ検出用画像の高さ（デフォルト480）
});
context.init(function onCompleted() {                  // コンテクスト初期化が完了したら
    camera.projectionMatrix.copy(context.getProjectionMatrix());   // 射影行列をコピー
});



//---------------------------------------------------------------------
//シーン構成
//---------------------------------------------------------------------

//アニメーション用設定
const clock = new THREE.Clock();
let mixers = new Array();


function initScene() {

    //マーカーを登録
    var marker1 = new THREE.Group();
    var controls = new THREEx.ArMarkerControls(context, marker1, {
        type: "pattern",
        patternUrl: "assets/markers/WebAR.patt",
    });

    //シーンにマーカーを追加
    scene.add(marker1);
    //このmarker1にモデルを追加していく

    // ドーナツを作成
    geometry = new THREE.TorusKnotGeometry(0.1, 0.1, 100, 16);
    // マテリアルを作成
    material = new THREE.MeshToonMaterial({ color: 0x6699FF });
    // メッシュを作成
    const mesh = new THREE.Mesh(geometry, material);
    // 3D空間にメッシュを追加
    mesh.position.set(0, 0.3, -1);
    marker1.add(mesh);

    const cardGeometry = new THREE.PlaneGeometry(2.15, 1.3);
    const cardMaterialRed = new THREE.MeshLambertMaterial({ color: 0xFF0000, side: THREE.DoubleSide });
    const cardMaterialBlue = new THREE.MeshLambertMaterial({ color: 0x0000ff, side: THREE.DoubleSide });
    const cardMaterialGreen = new THREE.MeshLambertMaterial({ color: 0x00ff00, side: THREE.DoubleSide });

    const profileVideo = document.getElementById('profile');
    textureProfile = new THREE.VideoTexture(profileVideo);
    textureProfile.minFilter = THREE.LinearFilter;
    textureProfile.magFilter = THREE.LinearFilter;
    textureProfile.format = THREE.RGBFormat;
    const profileCardMaterial = new THREE.MeshBasicMaterial({ map: textureProfile, overdraw: true, side: THREE.DoubleSide });

    var loader = new THREE.TextureLoader();

    cards = [];
    let cardNum = 0;
    const textureVauta = loader.load('../assets/textures/vauta.png');
    const materialVauta = new THREE.MeshLambertMaterial({ map: textureVauta, side: THREE.DoubleSide });
    cards.push(new THREE.Mesh(cardGeometry, materialVauta));
    cards[cardNum].rotation.x = -Math.PI / 2;
    cards[cardNum].position.set(-0.5, 0.25, 0);
    cards[cardNum].name = "vauta";
    marker1.add(cards[cardNum]);

    cardNum++;
    cards.push(new THREE.Mesh(cardGeometry, cardMaterialBlue));
    cards[cardNum].rotation.x = -Math.PI / 2;
    cards[cardNum].position.set(-0.5, 0.5, 0);
    marker1.add(cards[cardNum]);

    cardNum++
    cards.push(new THREE.Mesh(cardGeometry, profileCardMaterial));
    cards[cardNum].rotation.x = -Math.PI / 2;
    cards[cardNum].position.set(-0.5, 0.75, 0);
    cards[cardNum].name = "profile";
    marker1.add(cards[cardNum]);


}

//---------------------------------------------------------------------
//　Tween アニメーション
//---------------------------------------------------------------------

// card1 
var twIni1 = { posZ: 0, rotY: 0 };                      // 初期パラメータ
var twVal1 = { posZ: 0, rotY: 0 };                      // tweenによって更新されるパラメータ
var twFor1 = { posZ: 1.4 };              // ターゲットパラメータ
// 「行き」のアニメーション
function tween1() {
    var tween = new TWEEN.Tween(twVal1)                 // tweenオブジェクトを作成
        .to(twFor1, 2000)                                   // ターゲットと到達時間
        .easing(TWEEN.Easing.Back.Out)                      // イージング
        .onUpdate(function () {                              // フレーム更新時の処理
            cards[0].position.z = twVal1.posZ;                   // 位置を変更

        })
        .onComplete(function () {                            // アニメーション完了時の処理
            //tween1_back(index);                                    // 「帰り」のアニメーションを実行
        })
        .delay(0)                                           // 開始までの遅延時間
        .start();                                           // tweenアニメーション開始
}
// 「帰り」のアニメーション    
function tween1_back() {
    var tween = new TWEEN.Tween(twVal1)
        .to(twIni1, 2000)                                   // ターゲットを初期パラメータに設定
        .easing(TWEEN.Easing.Back.InOut)
        .onUpdate(function () {
            cards[0].position.z = twVal1.posZ;                   // 位置を変更
        })
        .onComplete(function () {
            // なにもしない
        })
        .delay(100)
        .start();
}

var twIni2 = { posZ: 0, rotY: 0 };                      // 初期パラメータ
var twVal2 = { posZ: 0, rotY: 0 };                      // tweenによって更新されるパラメータ
var twFor2 = { posZ: 1.4 };              // ターゲットパラメータ
// 「行き」のアニメーション
function tween2() {
    var tween = new TWEEN.Tween(twVal2)                 // tweenオブジェクトを作成
        .to(twFor2, 2000)                                   // ターゲットと到達時間
        .easing(TWEEN.Easing.Back.Out)                      // イージング
        .onUpdate(function () {                              // フレーム更新時の処理
            cards[1].position.z = twVal2.posZ;                   // 位置を変更

        })
        .onComplete(function () {                            // アニメーション完了時の処理
            //tween1_back(index);                                    // 「帰り」のアニメーションを実行
        })
        .delay(0)                                           // 開始までの遅延時間
        .start();                                           // tweenアニメーション開始
}
// 「帰り」のアニメーション    
function tween2_back() {
    var tween = new TWEEN.Tween(twVal2)
        .to(twIni1, 2000)                                   // ターゲットを初期パラメータに設定
        .easing(TWEEN.Easing.Back.InOut)
        .onUpdate(function () {
            cards[1].position.z = twVal2.posZ;                   // 位置を変更
        })
        .onComplete(function () {
            // なにもしない
        })
        .delay(100)
        .start();
}

//===================================================================
// クリックイベント
//===================================================================
window.addEventListener("mousedown", function (ret) {
    var mouseX = ret.clientX;                           // マウスのx座標
    var mouseY = ret.clientY;                           // マウスのy座標
    mouseX = (mouseX / window.innerWidth) * 2 - 1;    // -1 ～ +1 に正規化されたx座標
    mouseY = -(mouseY / window.innerHeight) * 2 + 1;    // -1 ～ +1 に正規化されたy座標
    var pos = new THREE.Vector3(mouseX, mouseY, 1);     // マウスベクトル
    pos.unproject(camera);                              // スクリーン座標系をカメラ座標系に変換
    // レイキャスタを作成（始点, 向きのベクトル）
    var ray = new THREE.Raycaster(camera.position, pos.sub(camera.position).normalize());
    var obj = ray.intersectObjects(scene.children, true);   // レイと交差したオブジェクトの取得
    if (obj.length > 0) {                                // 交差したオブジェクトがあれば
        picked(obj[0].object.name);                       // ピックされた対象に応じた処理を実行
    }
});
// ピックされた対象に応じた処理
function picked(objName) {
    switch (objName) {
        case "profile":
            changeState();
            break;
        case "vauta":
            window.location.href = 'http://vauta.netlify.com';
            break;
        default:
            break;
    }
}

let state = 0;
function changeState() {
    switch (state) {
        case 0:
            tween1();
            state = 1;
            break;
        case 1:
            tween2();
            state = 2;
            break;
        case 2:
            tween1_back();
            tween2_back();
            state = 0;
        default:
            break;
    }
}

//---------------------------------------------------------------------
//　描画
//---------------------------------------------------------------------

//描画関数
function renderScene() {
    //ブラウザの描画更新ごとに呼び出される
    requestAnimationFrame(renderScene);
    //アニメーションの更新
    let delta = clock.getDelta();
    for (let i = 0, len = mixers.length; i < len; ++i) {
        mixers[i].update(delta);
    }

    if (source.ready === false) { return; }             // メディアソースの準備ができていなければ抜ける
    context.update(source.domElement);                  // ARToolkitのコンテキストを更新
    TWEEN.update();                                     // Tweenアニメーションを更新
    renderer.render(scene, camera);                     // レンダリング実施

}

window.onload = function () {
    initScene();
    renderScene();
};