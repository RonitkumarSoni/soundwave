import React,{useMemo,useRef,useState} from 'react';
import {View,Text,StyleSheet,PanResponder} from 'react-native';
interface Props {progress:number;currentTime:string;totalTime:string;onSeek:(value:number)=>void;}
const clamp=(value:number)=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
export function SeekBar({progress,currentTime,totalTime,onSeek}:Props){
 const width=useRef(1),origin=useRef(0),position=useRef(0);
 const [drag,setDrag]=useState<number|null>(null);
 const responder=useMemo(()=>PanResponder.create({
  onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,
  onPanResponderGrant:event=>{origin.current=event.nativeEvent.pageX-event.nativeEvent.locationX;position.current=clamp(event.nativeEvent.locationX/width.current);setDrag(position.current);},
  onPanResponderMove:(_,gesture)=>{position.current=clamp((gesture.moveX-origin.current)/width.current);setDrag(position.current);},
  onPanResponderRelease:()=>{onSeek(position.current);setDrag(null);},
  onPanResponderTerminate:()=>setDrag(null),onPanResponderTerminationRequest:()=>false,
 }),[onSeek]);
 const value=drag??clamp(progress);
 const percent: `${number}%` = `${value * 100}%`;
 return <View style={styles.container}>
 <View {...responder.panHandlers} onLayout={event=>{width.current=Math.max(1,event.nativeEvent.layout.width)}} style={styles.touchArea}
 accessibilityRole="adjustable" accessibilityLabel="Song playback position" accessibilityValue={{min:0,max:100,now:Math.round(value*100),text:currentTime+' of '+totalTime}}
 accessibilityActions={[{name:'increment',label:'Seek forward'},{name:'decrement',label:'Seek backward'}]}
 onAccessibilityAction={event=>onSeek(clamp(progress+(event.nativeEvent.actionName==='increment'?0.05:-0.05)))}>
 <View pointerEvents="none" style={styles.track}><View style={[styles.fill,{width:percent}]}/></View>
 <View pointerEvents="none" style={[styles.thumb,{left:percent,transform:[{translateX:-7},{scale:drag===null?1:1.25}]}]}/>
 </View><View style={styles.times}><Text style={styles.label}>{currentTime}</Text><Text style={styles.label}>{totalTime}</Text></View>
 </View>;
}
const styles=StyleSheet.create({container:{paddingHorizontal:28,marginVertical:12},touchArea:{height:44,justifyContent:'center'},track:{height:4,borderRadius:2,backgroundColor:'rgba(255,255,255,0.25)',overflow:'hidden'},fill:{height:4,backgroundColor:'#FFF',borderRadius:2},thumb:{position:'absolute',top:15,height:14,width:14,borderRadius:7,backgroundColor:'#FFF'},times:{flexDirection:'row',justifyContent:'space-between'},label:{fontSize:12,color:'rgba(255,255,255,0.72)',fontVariant:['tabular-nums']}});
