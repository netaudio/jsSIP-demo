





var login = document.getElementById("login");


var sip_uri_;
var sip_password_ ;
var ws_uri_;
var sip_phone_number;


function testStart(){
    var socket = new JsSIP.WebSocketInterface(ws_uri_);
    var configuration = {
        sockets: [ socket ],
        outbound_proxy_set: ws_uri_,
        uri: sip_uri_,
        password: sip_password_,
        register: true,
        session_timers: false,
        register_expires:900//注册时间秒为单位 900s==15m
    };

    userAgent = new JsSIP.UA(configuration);

    userAgent.on('registered', function(data){//初始化成功
        console.info("registered: ", data.response.status_code, ",", data.response.reason_phrase);
        headPortrait.src = "./img/face2.png";
        captureLocalMedia();
        calling.style.display="block"
    });

    userAgent.on('registrationFailed', function(data){
        console.log("registrationFailed, ", data);
    });

    userAgent.on('registrationExpiring', function(){
        console.warn("registrationExpiring");
    });

    userAgent.on('newRTCSession', function(data){
        console.info('onNewRTCSession: ', data);
        if(data.originator == 'remote'){ //incoming call
            console.info("incomingSession, answer the call");
            incomingSession = data.session;
            data.session.answer({'mediaConstraints' : { 'audio': true, 'video': true}, 'mediaStream': localStream});
        }else{
            console.info("outgoingSession");
            outgoingSession = data.session;
            outgoingSession.on('connecting', function(data){
                console.info('onConnecting - ', data.request);
                currentSession = outgoingSession;
                outgoingSession = null;
            });


            audio.pause();
            audio.src = "./sounds/ringback.ogg";// 去电播放音
            audio.play();
            timeAudio = setInterval(function () {
                audio.play();
            },2000)
        }
        data.session.on('accepted', function(data){//接受
            calling.style.display="none";
            clearInterval(timeAudio);
            audio.pause();
            audio.src = "./sounds/answered.mp3";// 去电播放音
            audio.play();

            console.info('onAccepted - ', data);
            videoView.style.display="block";
            videoView2.style.display="block";
            if(data.originator == 'remote' && currentSession == null){
                currentSession = incomingSession;
                incomingSession = null;
                console.info("setCurrentSession - ", currentSession);
            }
        });
        data.session.on('confirmed', function(data){
            console.info('onConfirmed - ', data);
            if(data.originator == 'remote' && currentSession == null){
                currentSession = incomingSession;
                incomingSession = null;
                console.info("setCurrentSession - ", currentSession);
            }
        });
        data.session.on('sdp', function(data){
            console.info('onSDP, type - ', data.type, ' sdp - ', data.sdp);
        });
        data.session.on('progress', function(data){
            console.info('onProgress - ', data.originator);
            if(data.originator == 'remote'){
                console.info('onProgress, response - ', data.response);
            }
        });
        data.session.on('ended', function (data) {//已建立的通话结束时
            console.info('ended - ', data);
            if (data.originator == "remote") {
                videoView2.style.display = "none";
                videoView.src="";
                videoView.style.display = "none";
            } else if (data.originator == "local") {
                videoView2.style.display = "none";
                videoView.src="";
                videoView.style.display = "none";
            }else {
                alert("系统挂断");
                videoView2.style.display = "none";
                videoView.src="";
                videoView.style.display = "none";
                location.replace(location);
            }
        });
        data.session.on('peerconnection', function(data){


            console.info('onPeerconnection - ', data.peerconnection);
            data.peerconnection.onaddstream = function(ev){//渲染对方视频
                console.info('onaddstream from remote - ', ev);
                videoView2.src = URL.createObjectURL(ev.stream);
            };
        });
    });

    userAgent.on('newMessage', function(data){
        if(data.originator == 'local'){
            console.info('onNewMessage , OutgoingRequest - ', data.request);
        }else{
            console.info('onNewMessage , IncomingRequest - ', data.request);
        }
    });

    console.info("call register");
    userAgent.start();
}


login.onclick=function(){//新建会话

	sip_uri_ = document.getElementById("sip_uri").value.toString();
    sip_password_ = document.getElementById("sip_password").value.toString();
    ws_uri_ = document.getElementById("ws_uri").value.toString();
    sip_phone_number = document.getElementById("sip_phone_number").value.toString();

    testStart();
};
