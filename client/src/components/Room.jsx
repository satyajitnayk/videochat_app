import React, { useCallback, useEffect, useState } from 'react';
import { useSocket } from '../context/SocketProvider';
import ReactPlayer from 'react-player';
import peer from '../services/peer';

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`${email} joined the room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit('user:call', { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      console.log(`incomong call`, from, offer);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      const ans = await peer.getAnswer(offer);
      socket.emit('call:accepted', { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log('Call Accepted!');
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeedIncoming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit('peer:nego:done', { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit('peer:nego:needed', { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener('negotiationneeded', handleNegoNeeded);

    return () => {
      peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    peer.peer.addEventListener('track', async (ev) => {
      setRemoteStream(ev.streams[0]);
    });
  }, []);

  useEffect(() => {
    socket.on('user:joined', handleUserJoined);
    socket.on('incoming:call', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('peer:nego:needed', handleNegoNeedIncoming);
    socket.on('peer:nego:final', handleNegoNeedFinal);

    return () => {
      socket.off('user:joined', handleUserJoined);
      socket.off('incoming:call', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('peer:nego:needed', handleNegoNeedIncoming);
      socket.off('peer:nego:final', handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoNeedIncoming,
    handleNegoNeedFinal,
  ]);

  return (
    <div>
      <h1>Room Page</h1>
      <h4>{remoteSocketId ? 'Connected' : 'no one in the room'}</h4>
      {myStream && <button onClick={sendStreams}>Send Stream</button>}
      {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}

      {myStream && (
        <>
          <h1>My Stream</h1>
          <ReactPlayer
            playing
            muted
            height="100px"
            width="200px"
            url={myStream}
          />
        </>
      )}
      {remoteStream && (
        <>
          <h1>Remote Stream</h1>
          <ReactPlayer
            playing
            muted
            height="100px"
            width="200px"
            url={remoteStream}
          />
        </>
      )}
    </div>
  );
};

export default RoomPage;
