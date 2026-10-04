const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const config=require(path.join(root,'app.json')).expo;
if(config.newArchEnabled!==false)throw new Error('Track Player 4 requires this project to build in legacy architecture');
const animation=require(path.join(root,'node_modules/react-native-reanimated/package.json'));
if(!animation.version.startsWith('3.'))throw new Error('Legacy architecture requires Reanimated 3');
const player=path.join(root,'node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt');
if(fs.existsSync(player)){
 let text=fs.readFileSync(player,'utf8');
 text=text.replace('Arguments.fromBundle(musicService.tracks[index].originalItem)','musicService.tracks[index].originalItem?.let { Arguments.fromBundle(it) }');
 text=text.replace(/Arguments.fromBundle\(\s*musicService.tracks\[musicService.getCurrentTrackIndex\(\)\].originalItem\s*\)/g,'musicService.tracks[musicService.getCurrentTrackIndex()].originalItem?.let { Arguments.fromBundle(it) }');
 fs.writeFileSync(player,text);
}
const razorpay=path.join(root,'node_modules/react-native-razorpay/android/build.gradle');
if(fs.existsSync(razorpay)){
 let text=fs.readFileSync(razorpay,'utf8');
 if(!text.includes('namespace '))text=text.replace('android {','android {\n    namespace "com.razorpay.rn"');
 fs.writeFileSync(razorpay,text);
}
console.log('Native compatibility checks applied.');
