
var Constraints = {audio: true,  video: true};
var RTCPeerConfig = { 'iceServers':
                        [{'urls': 'stun:stun.l.google.com:19302'},
                         {'urls': 'stun:stun1.l.google.com:19302'}]
                    }




function WebcamPeer () {
  this.VideoLocal = $('#videoLocal')[0];
  this.VideoRemote = $('#videoRemote')[0];
  this.LocalStream;
  this.RemoteStream;
  this.LocalPC;
  this.LocalDC;
  this.RemoteDC;
  this.Started = false; // When localStream added to LocalPC
  this.FirstPeer = false;
}


WebcamPeer.prototype.addRemoteCandidate = function (candidate) {
  this.LocalPC.addIceCandidate(
    new RTCIceCandidate(candidate)
  );
};

WebcamPeer.prototype.onRequestOffer = function () {
  this.FirstPeer = true;
  this.__prepareLocalConnection();
  if (LocalStream && !this.Started){
    this.Started = true;
    this.LocalPC.addStream(LocalStream);
    this.__createAndSendOffer();
  }
};

WebcamPeer.prototype.onOfferReceived = function (sdpOffer) {
  this.FirstPeer = false;
  this.__prepareLocalConnection();
  this.LocalPC.setRemoteDescription(sdpOffer)
  .then(function () {
    if (LocalStream && !this.Started){
      Started = true;
      this.LocalPC.addStream(LocalStream);
      this.__createAndSendAnswer();
    }
  })
  .catch(function (error) {
    console.error('Error creating answer:', error);
  });
};

WebcamPeer.prototype.onAnswerReceived = function (sdpAnswer) {
  this.LocalPC.setRemoteDescription(sdpAnswer);
};

WebcamPeer.prototype.__getUserMedia = function () {
  if (LocalStream) {
    this.__onUserMedia();
  } else {
    navigator.mediaDevices.getUserMedia(Constraints)
    .then(this.__onUserMedia)
    .catch(function(error) {
      alert('Get user media error: ' + error.name);
      console.log(error);
    });
  }
};

WebcamPeer.prototype.__onUserMedia = function (stream) {
  this.LocalStream = stream;
  this.VideoLocal.srcObject = stream;
  if (this.LocalPC && !this.Started){
    this.Started = true;
    this.LocalPC.addStream(stream);
    if (FirstPeer)
      this.__createAndSendOffer();
    else
      this.__createAndSendAnswer();
  }
};

WebcamPeer.prototype.__onLocalIceCandidate = function (ev) {
  console.log('candidate');
  if (ev.candidate){
    window.Signaling.sendCandidate(ev.candidate);
  } else {
    console.log('No more candidates');
  }
};

WebcamPeer.prototype.__onAddStream = function (ev) {
  this.VideoRemote.srcObject = ev.stream;
  this.RemoteStream = ev.stream;
};

WebcamPeer.prototype.__prepareLocalConnection = function () {
  this.LocalPC = new RTCPeerConnection(RTCPeerConfig);
  console.log('BEGIN LOCAL PC')
  this.LocalDC = this.LocalPC.createDataChannel(null);
  this.LocalDC.onopen = __onOpenDataChannelLocal;
  this.LocalDC.onclose = onCloseDataChannelLocal;
  this.LocalPC.ondatachannel = onDataChannelCreated
  this.LocalPC.onicecandidate = this.__onLocalIceCandidate;
  this.LocalPC.onaddstream = this.__onAddStream;
};

WebcamPeer.prototype.__createAndSendOffer = function () {
  this.LocalPC.createOffer({})
  .then(function (sdpOffer) {
    console.log('Offer:', sdpOffer);
    this.LocalPC.setLocalDescription(sdpOffer)
    .then(function () {
      window.Signaling.sendOffer(sdpOffer);
    })
    .catch(function (error) {
      console.error('Error creating offer:', error);
    });
  });
};

WebcamPeer.prototype.__createAndSendAnswer = function () {
  this.LocalPC.createAnswer()
  .then(function (sdpAnswer) {
    console.log('Answer:', sdpAnswer);
    this.LocalPC.setLocalDescription(sdpAnswer)
    .then(function () {
      window.Signaling.sendAnswer(sdpAnswer);
    });
  });

};



WebcamPeer.prototype.__onOpenDataChannelLocal = function () {
  console.log('Data Channel open');
  alert('Modifythis')
  $('#sendText').prop('disabled', false);
  $('#sendText').click(sendMessage);
  $('#localText').keyup(function (ev) {
    if (ev.which == 13 ) {
      sendMessage();
      ev.preventDefault();
    }
  });
};

WebcamPeer.prototype.methodName = function () {

};


function sendMessage() {
  var msg = $('#localText').val();
  $('#localText').val('');
  LocalDC.send(msg);
  $('#chat').append('<div><strong>Me:</strong> ' + msg + '</div>');
}

function onCloseDataChannelLocal() {
  $('#sendText').prop('disabled', true);
  $('#chat').empty();
  $('#sendText').unbind('click');
  $('#localText').unbind('keyup');

}

function onDataChannelCreated(ev) {
  RemoteDC = ev.channel;
  RemoteDC.onmessage = onMessageReceived;
}

function onMessageReceived(ev) {
  $('#chat').append('<div><strong>Other:</strong> ' + ev.data + '</div>');
}

function stopCommunication() {
  window.Signaling.sendBye();
  if (LocalStream){
    LocalStream.getTracks().forEach(function (track) {
      track.stop();
    });
    LocalStream = null;
  }
  if (RemoteStream){
    RemoteStream.getTracks().forEach(function (track) {
      track.stop();
    });
    RemoteStream = null;
  }
  if (LocalPC){
    LocalPC.close();
    LocalPC = null;
  }
  if (LocalDC) LocalDC = null;
  if (RemoteDC) RemoteDC = null;
  Started = false;
  FirstPeer = false;
  VideoLocal.srcObject = null;
  VideoRemote.srcObject = null;
  $('#roomName').prop('disabled', false);
  $('#joinButton').prop('disabled', false);
  $('#byeButton').prop('disabled', true);
}
