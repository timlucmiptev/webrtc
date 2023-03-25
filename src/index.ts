const iceServers = [
  { urls: 'stun:65.21.6.180:3478' },
  {
    urls: 'turn:65.21.6.180:3478',
    username: 'timtime',
    credential: 'blahblah',
  },
];

const signalingServerUrl = 'wss://peerjs.uqbar.network:443';
const signaling = new WebSocket(signalingServerUrl);

const peerConnectionConfig = { iceServers };
const peerConnection = new RTCPeerConnection(peerConnectionConfig);

signaling.addEventListener('message', async (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'offer') {
    await peerConnection.setRemoteDescription(data);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    signaling.send(JSON.stringify(answer));
  } else if (data.type === 'answer') {
    await peerConnection.setRemoteDescription(data);
  } else if (data.type === 'icecandidate') {
    const candidate = new RTCIceCandidate(data);
    await peerConnection.addIceCandidate(candidate);
  }
});

peerConnection.addEventListener('icecandidate', (event) => {
  const candidate = event.candidate;

  if (candidate) {
    signaling.send(
      JSON.stringify({ type: 'icecandidate', candidate: candidate }),
    );
  }
});

peerConnection.addEventListener('track', (event) => {
  const remoteStream = event.streams[0];
  const remoteVideoElement = (document.getElementById('remote-video') as HTMLVideoElement);
  remoteVideoElement.srcObject = remoteStream;
});

document.getElementById('start-button').addEventListener('click', async () => {
  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  const localVideoElement = (document.getElementById('local-video') as HTMLVideoElement);
  localVideoElement.srcObject = localStream;

  const offer = await peerConnection.createOffer();
  alert(offer)
  await peerConnection.setLocalDescription(offer);

  console.log(offer)

  console.log(JSON.stringify(offer));
  signaling.send(JSON.stringify(offer));
});