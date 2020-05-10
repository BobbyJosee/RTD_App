import * as React from 'react';
import {useCallback, useRef, useState, useEffect } from 'react';
import {  AppState, Text, View, Button, FlatList, Header,StyleSheet, TextInput,TouchableOpacity, } from 'react-native';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import firebase from 'firebase'
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Permissions from 'expo-permissions';
const { convertArrayToCSV } = require('convert-array-to-csv');
import {Notifications} from 'expo'
import ToggleSwitch from 'toggle-switch-react-native'
import Card from '../assets/Components/Card';
import MaterialButtonDanger from '../assets/Components/MaterialButtonDanger';
import NetInfo from '@react-native-community/netinfo';


function wait(timeout) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout);
  });
}


function DetailsScreen({ route, navigation }) {

  useFocusEffect(
    React.useCallback(() => {
      //alert('Screen was focused');
      // Do something when the screen is focused
      return () => {
        //alert('Screen was unfocused');
        // Do something when the screen is unfocused
        // Useful for cleanup functions
      };
    }, [])
  );
  /* 2. Get the param */
  const { itemId } = route.params;
  const { otherParam } = route.params;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Details Screen</Text>
      <Text>itemId: {JSON.stringify(itemId)}</Text>
      <Text>otherParam: {JSON.stringify(otherParam)}</Text>
      <Button
        title="Go to Details... again"
        onPress={() =>
          navigation.push('Details', {
            itemId: Math.floor(Math.random() * 100),
          })
        }
      />
      <Button title="fireUpdate" onPress={async() => {firebase
            .database()
            .ref('/deviceID/9544900804').update({
              last_logged_in:Date.now()
            })}} />
      <Button title="Go to Home" onPress={() => navigation.navigate('dashboard')} />
      <Button title="Go back" onPress={() => navigation.goBack()} />
    </View>
  );
}

function Role({route, navigation }) {
  saveFile = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if (status === "granted") {
        let fileUri = FileSystem.documentDirectory + "text.csv";
        await FileSystem.writeAsStringAsync(fileUri, "Hello World", { encoding: FileSystem.EncodingType.UTF8 });
        const asset = await MediaLibrary.createAssetAsync(fileUri)
        await MediaLibrary.createAlbumAsync("Download", asset, false)
    }
  }
  useEffect(() => {
    saveFile()
  },[]);

  return null
 
    
  }

function Games({route, navigation }) {
    const [loading, setLoading] = useState(true);
    const [games, setGames] = useState([]);
    const [loading1, setLoading1] = useState(true);
    const [internet, setInternet] = useState(true);
    const [appState, setAppState] = useState('');
    const [refreshing, setRefreshing] = React.useState(false);
    const [bgtime, setBgtime] = useState('');
    //const [refresh, setRefresh]= useState(1)
    const uid = firebase.auth().currentUser.uid;
    var currentUser = firebase.auth().currentUser;
    

    const refresh = route.params.refresh

    const onRefresh = React.useCallback(() => {
      setRefreshing(true);
      console.log('refreshing')
      wait(2000).then(() => setRefreshing(false));
    }, [refreshing]);

   
    async function registerForPushNotificationsAsync() {
      const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
      // only asks if permissions have not already been determined, because
      // iOS won't necessarily prompt the user a second time.
      // On Android, permissions are granted on app installation, so
      // `askAsync` will never prompt the user
    
      // Stop here if the user did not grant permissions
      if (status !== 'granted') {
        alert('No notification permissions!');
        return;
      }
      try{
      // Get the token that identifies this device
      let token = await Notifications.getExpoPushTokenAsync();
    
      // POST the token to your backend server from where you can retrieve it to send push notifications.
      firebase
        .database()
        .ref('user/' + currentUser.uid + '/push_token')
        .set(token);
    } catch (error) {
      console.log(error);
    }
    } 
    
    useEffect(() =>{
      async function mountComponent() {

        currentUser = await firebase.auth().currentUser
        console.log('current user:', currentUser)
        await registerForPushNotificationsAsync()
      }
      mountComponent()
      
    },[])
    
    

    

    useEffect(() => {
      
      var backgroundTime = Date.now()
      var devices = []
      setLoading1(true)
      function userDevice() {
        return new Promise(async (returnlist,reject) =>{

          // Get the users ID
        const list = []
        const uid = firebase.auth().currentUser.uid;
       
        // Create a reference
        const ref = firebase.database().ref(`/user/${uid}/userDevices`).orderByChild('timestamp');
       
        // Fetch the data snapshot
        const snapshot = await ref.once('value');
        snapshot.forEach(game => {
          list.push({
             // Add custom key for FlatList usage
            ...game.val(),
          });
        });
       
        console.log('User data: ', snapshot.val());
        console.log('User list: ', list);

        returnlist(list)
        setLoading1(false)

        })
        
      }
      
      userDevice().then((list)=>{
        console.log('returned ,then list:',list)
        devices = list
        list.forEach(dev =>{
          console.log('devide ID',dev.devID)
          const ref = firebase.database().ref(`/user/deviceID/num${dev.devID}`);
          ref.on('value', updateTemp);
        })
        
      }).catch((err) => {
        throw new Error('Higher-level error. ' + err.message);
      })
      
      function updateTemp(snapshot){
        console.log('updateTemp snapshot',snapshot.val())
        console.log('updateTemp devices',devices)
        let arr2 =[]
        devices.forEach(dev =>{
          if (dev.devID == snapshot.val().devID){
            console.log('equal devID',dev.devID, snapshot.val().devID)
            arr2.push({
              devID: snapshot.val().devID,
              temperature: snapshot.val().temp,
              nickname: dev.nickname,

            })
          }
          else{
            console.log('not equal', dev.devID, snapshot.val().devID)
          }
          console.log('arr2',arr2)
          var renderDevices = devices.map(obj => arr2.find(o => o.devID === obj.devID) || obj);
          devices = renderDevices
          console.log('renderdDEvices:', renderDevices)
          setGames(renderDevices);
          setLoading(false);
          
        })


      }   
      const unsubscribe = NetInfo.addEventListener(state => {
        console.log('Connection type :::::::::::::::::::::::::::::::::::::::::::::::::', state.type);
        console.log('Is connected?::::::::::::::::::::::::::::::::::::::::::::::::', state.isConnected);
        setInternet(state.isConnected)
      });
      /*var unsubscribeAppState = AppState.addEventListener('change', state =>{
        console.log('AppState:::::::::::::::::::::::::::::::::::::', state);
        if(state == "active")
        setAppState(Date.now())
      })*/
      var unsubscribeAppState = AppState.addEventListener('change', appStateChange);
      function appStateChange(appState){
        console.log('AppState:::::::::::::::::::::::::::::::::::::', appState);
        if(appState == "active")
        {
          console.log(backgroundTime)
          setAppState(Date.now())
          var diffMs = Date.now() - backgroundTime;
          console.log('difference in ms', diffMs)
          var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
          console.log('difference in mins', diffMins)
          if (diffMins >= 5){
            //reload app()--------------
            restartApp()
          }
          //setAppState(appState)
        }else if(AppState.currentState == "background"){
          backgroundTime = Date.now()
          console.log(backgroundTime)
          setBgtime(backgroundTime)
        }
      }
      

//----------------------------main notification start------------------------------------------------------------
      const ref = firebase.database().ref(`/user/${uid}`)
      ref.child('mainEnableNotification').on('value', changeNotification);


      function changeNotification (snapshot){
        
        devices.forEach(async (dev) =>{
          const ref1 = firebase.database().ref(`/user/deviceID/num${dev.devID}/linkedUser/${uid}/`)
          console.log('notification change::::::::::', snapshot.val())
          await ref1.update({
            enableNotification: snapshot.val(),
          })

        })
      }
//----------------------------main notification end------------------------------------------------------------      
      return () => {
        
        unsubscribe();
        //unsubscribeAppState();
        unsubscribeAppState = AppState.removeEventListener('change', appStateChange);
        devices.forEach(dev =>{
          const ref = firebase.database().ref(`/user/deviceID/num${dev.devID}`);
          ref.off('value', updateTemp);
        })

        const ref1 = firebase.database().ref(`/user/${uid}/userDevices`)
        ref1.off('value', userDevice);
        const ref = firebase.database().ref(`/user/${uid}`)
        ref.child('mainEnableNotification').off('value', changeNotification);
      }          
    },[uid,refresh,internet,appState]);

    useEffect(() =>{
      const ref = firebase.database().ref(`/user/${uid}`)
      ref.child('mainEnableNotification').on('value', changeNotification);
      
      
      function changeNotification (snapshot){
        
        games.forEach(async (dev) =>{
          const ref1 = firebase.database().ref(`/user/deviceID/num${dev.devID}/linkedUser/${uid}/`)
          console.log('notification change::::::::::', snapshot.val())
          await ref1.update({
            enableNotification: snapshot.val(),
          })

        })
      }
    },[uid])
    
    
    const onclickDevice = (devID, nickname) => {
      if(!loading1){
        console.log('button Clicked:', devID, nickname)
        navigation.navigate('Device Screen',{devID:devID, nickname:nickname})
      }
    }

/*########## render function starts ########### */
  const renderInternet = () => {  
      if(!internet){
        return(
          <Text> Connection lost! </Text>
          )
        }
  }
  const renderLoading1 = () =>{  
      if(loading1){
        return(
          <Text> Refreshing!!!!!! </Text>
          )
          
        }
  }      
  /*########## render function ends ########### */

  if (loading) {
      return <Text>Loading devices...</Text>;
  }
  //change stylesheet to a different place

    const renderStyles = StyleSheet.create({
      headings : {
        width: '50%',
        height : 50,
        padding :10,
        backgroundColor : '#cdcddced',
        margin :10 
      }
    }) 

    return (
      <View style={{ flex: 1, margin : 10 }} >
        <View style={{flex :0.07 ,flexDirection :'row' , height : 20, marginTop:10 }} >
          <Text style ={{width :'30%', textAlign: 'center' , fontSize :13  }} >TEMPERATURE</Text>
          <Text style ={{width :'70%' , textAlign :'center' ,fontSize :13  }}>DEVICE</Text>
        </View> 
          <FlatList data={games} 
             style={{}}     
            renderItem={({ item }) => (
            <Card
                devID = {item.devID}
                temp = {item.temperature}
                nickname = {item.nickname}
                onclickDevice = {onclickDevice}
                onRefresh={onRefresh}
                refreshing={refreshing}
            />
            )} 
          keyExtractor={(item, index) => index.toString()} 
          />
        {renderLoading1()}
        {renderInternet()}
      </View>
    )
}


        
function deviceScreen({route,navigation}){
  const [temp, setTemp] = useState(null);
  const [listLogs, setListLogs] = useState([])
  const [tempLogs, setTempLogs] = useState(1);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const devID = route.params.devID
  const nickname = route.params.nickname

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    console.log('refreshing')
    wait(5000).then(() => {
      setRefreshing(false)
      console.log('done refreshing')
    });
    
  }, [refreshing]);
  useEffect(() => {
    const getTemp = (snapshot) => {
      console.log('snapshot inside device screen',snapshot.val().devID)
      setTemp(snapshot.val().temp)
      console.log('snapshot key:', snapshot.key)

    }
    const ref = firebase.database().ref(`/user/deviceID/num${devID}`);
    ref.on('value', getTemp);
    //getLogTemp()
    
    return () => {
      const ref = firebase.database().ref(`/user/deviceID/num${devID}`);
      ref.off('value', getTemp);
    }

  },[])
  
  var getLogTemp = async() =>{
    setLoading(true)
    const list1 =[]
    const ref = firebase.database().ref(`/rtdStorage/rtdID${devID}/fullLogs/`);
    const snapshot = await ref.once('value');
    console.log('snapshot                ::::', snapshot.val())
    snapshot.forEach(time =>{
      var timestamp = new Date(time.val().timestamp)
      console.log('timestamp:', timestamp.getFullYear())
      var year = timestamp.getFullYear()
      var month = ("0" + (timestamp.getMonth() + 1)).slice(-2)
      var date = ("0" + timestamp.getDate()).slice(-2)
      var hours = ("0" + timestamp.getHours()).slice(-2)
      var minutes = ("0" + timestamp.getMinutes()).slice(-2)
      var seconds = ("0" + timestamp.getSeconds()).slice(-2)

      list1.push({
        date: date +'-'+ month +'-'+ year,
        time: hours +':'+ minutes +':'+ seconds,
        temperature: time.val().temperature,
      })
    })
    console.log('list 1                          ::::::::',list1)
    setTempLogs(list1.reverse())
    setLoading(false)
  }
  var saveLogs = async () => {
    const list =[]
    
    const ref = firebase.database().ref(`/rtdStorage/rtdID${devID}/fullLogs/`);
    const snapshot = await ref.once('value');
    console.log('snapshot', snapshot.val())
    snapshot.forEach(time =>{
      var timestamp = new Date(time.val().timestamp)
      console.log('timestamp:', timestamp.getFullYear())
      var year = timestamp.getFullYear()
      var month = ("0" + (timestamp.getMonth() + 1)).slice(-2)
      var date = ("0" + timestamp.getDate()).slice(-2)
      var hours = ("0" + timestamp.getHours()).slice(-2)
      var minutes = ("0" + timestamp.getMinutes()).slice(-2)
      var seconds = ("0" + timestamp.getSeconds()).slice(-2)

      list.push({
        date: date +'-'+ month +'-'+ year,
        time: hours +':'+ minutes +':'+ seconds,
        temperature: time.val().temperature,
      })
    })

    const csvFromArrayOfObjects = convertArrayToCSV(list);
    console.log('list:', list)
    console.log('csv From arr obj:', csvFromArrayOfObjects)
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if (status === "granted") {
        let fileUri = FileSystem.documentDirectory + "text.csv";
        await FileSystem.writeAsStringAsync(fileUri, csvFromArrayOfObjects, { encoding: FileSystem.EncodingType.UTF8 });
        const asset = await MediaLibrary.createAssetAsync(fileUri)
        await MediaLibrary.createAlbumAsync("Download", asset, false)
    }
    //console.log('list logs                  :::::', listLogs)
  }
  var hideLogs = () =>{
    setTempLogs(1)

  }
  navigation.setOptions({
    headerRight: () => (
      <Button
        onPress={() => navigation.navigate('Settings',{devID:devID, nickname:nickname})}
        title="settings"
      />
    ),
  });
//////render functions-------------------->Start----------------------------------------------------------->  
  function  displayFlatlist() {
    if (Array.isArray(tempLogs)) {
        return (
          
        <FlatList
          data={tempLogs}
          renderItem={({item}) => <Text style={styles.item}>{item.date}         {item.time}          {item.temperature}</Text>}
          onRefresh={onRefresh}
          refreshing={refreshing}
          keyExtractor={(item, index) => index.toString()}
        />
        ) 
        
    } else if(loading == true){
      return(<Text>Loading........!</Text>)
    } else {

        return(
          <Button
          onPress={
            () => getLogTemp()
          }
          title="Show Logs"
          />
        ) 
    }
  }
  function  displayText() {
    if (Array.isArray(tempLogs)) {
        return (
          
          <Text>        Date                             Time                        temperature</Text>
        ) 
    } 
  }
        
  function  displayDloadButton() {
    if (Array.isArray(tempLogs)) {
        return (
          <Button
          onPress={() => saveLogs()}
          title="download"
          />
          
        ) 
        
    } 
  }

  function  displayHideLogs() {
    if (Array.isArray(tempLogs)) {
        return (
          <Button
          onPress={() => hideLogs()}
          title="Hide Logs"
          />
          
        ) 
        
    } 
  }
  ///////render functions ------------->end---------------------------------------------------------->
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center'}}>
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Text>{devID} {nickname} {temp}</Text>
    
    </View>
        
        
        
        <View style={{ flex: 2, alignItems: 'center', justifyContent: 'center'}}>
        {displayHideLogs()}
        {displayDloadButton()}
        {displayText()}
        {displayFlatlist()}
        
    
    </View>
    </View>

  
  )
}

function settings({route, navigation}){
  const [toggleSw, setToggleSw] = useState(true);
  const [minTemp, setMinTemp] = useState(null);
  const [maxTemp, setMaxTemp] = useState(null);
  const [interval, setInterval] = useState('5');
  const [token, setToken] = useState('');
  const devID = route.params.devID
  const nickname = route.params.nickname
  const uid = firebase.auth().currentUser.uid;
  const ref3 = firebase.database().ref(`/user/deviceID/num${devID}/linkedUser/${uid}`)
  const ref2 = firebase.database().ref(`/user/deviceID/num${devID}`)
  const ref1 = firebase.database().ref(`/user/${uid}/push_token`)
  function onSettings(snapshot){
    setMinTemp(snapshot.val().minTemp)
    setMaxTemp(snapshot.val().maxTemp)
    setToggleSw(snapshot.val().enableNotification)
    setInterval(snapshot.val().interval)
  }
  function onInterval(snapshot){
    setInterval(snapshot.val().interval)
  }
  function onPushToken(snapshot){
    setToken(snapshot.val())
  }
  
    useEffect(() => {
      // Create reference
      
      ref3.once('value', onSettings);
      ref2.once('value', onInterval);
      ref1.once('value', onPushToken);
    }, [uid]);
 

  notificationRange = (async() =>{
      await ref3.update({
        minTemp: minTemp,
        maxTemp: maxTemp,
        push_token:token,
        
      })
      await ref2.update({
        interval: interval
      })
  })
  removeDevice = (async() =>{
      const ref = firebase.database().ref(`/user/${uid}/userDevices/dev${devID}`);
      await ref.remove();
      await ref3.remove();

  })
  return(
    //<Text>settings</Text>
    <View style ={{padding: 10}}>

    <ToggleSwitch
      isOn={toggleSw}
      onColor="green"
      offColor="red"
      label="Enable Notification"
      labelStyle={{ color: "black", fontWeight: "900" }}
      size="large"
      onToggle={async(isOn) => {
        console.log("changed to : ", isOn)
        setToggleSw(isOn)
        
        await ref3.update({
          enableNotification: isOn,
          push_token:token,
        })
      }}
      />
      <Text>Enter Minimum temperature</Text> 
      <TextInput
          style={{height: 40}}
          placeholder="minimum temperature"
          onChangeText={(text) => setMinTemp(text)}
          value={minTemp}
      />
      <Text>Enter Maximum temperature</Text>
      <TextInput
          style={{height: 40}}
          placeholder="maximum temperature here"
          onChangeText={(text) => setMaxTemp(text)}
          value={maxTemp}
      />
      <Text>Enter Interval for datalogs</Text>
      <TextInput
          style={{height: 40}}
          placeholder="enter interval"
          onChangeText={(text) => setInterval(text)}
          value={interval}
      />
      <Button
          onPress={() => notificationRange()}
          title="set"
      /> 
      <Button
          onPress={() => {
            removeDevice()
            .then(() => {
              navigation.navigate('flatList',{
                refresh: Date.now(),
              })
            })
          }}
          title="Remove Device"
      /> 
    </View>
    
    
  )
}

function FlatList_touchable_1({ logsTitle, onclickLogs }) {
  return (
    <TouchableOpacity
      onPress={() => onclickLogs(logsTitle)}
      style={[
        styles.item,
      ]}
    >
<Text style={styles.title}>{logsTitle}</Text>
    </TouchableOpacity>
  );
}

function logsScreen({route, navigation}){
  const devID = route.params.devID
  const nickname = route.params.nickname
  const clickedTitle = route.params.clickedTitle
  const [tempLogs, setTempLogs] = useState(1);

  var getLogTemp = async() =>{
    const list1 =[]
    const ref = firebase.database().ref(`/rtdStorage/rtdID${devID}/${clickedTitle}/`);
    const snapshot = await ref.once('value');
    console.log('snapshot                ::::', snapshot.val())
    snapshot.forEach(time =>{
      var timestamp = new Date(time.val().timestamp)
      console.log('timestamp:', timestamp.getFullYear())
      var year = timestamp.getFullYear()
      var month = ("0" + (timestamp.getMonth() + 1)).slice(-2)
      var date = ("0" + timestamp.getDate()).slice(-2)
      var hours = ("0" + timestamp.getHours()).slice(-2)
      var minutes = ("0" + timestamp.getMinutes()).slice(-2)
      var seconds = ("0" + timestamp.getSeconds()).slice(-2)

      list1.push({
        date: date +'-'+ month +'-'+ year,
        time: hours +':'+ minutes +':'+ seconds,
        temperature: time.val().temperature,
      })
    })
    console.log('list 1                          ::::::::',list1)
    setTempLogs(list1)
  }
  useEffect(() =>{
    getLogTemp()
  },[])
  saveLogs = async () => {
    const list =[]
    
    const ref = firebase.database().ref(`/rtdStorage/rtdID${devID}/${clickedTitle}/`);
    const snapshot = await ref.once('value');
    console.log('snapshot', snapshot.val())
    snapshot.forEach(time =>{
      var timestamp = new Date(time.val().timestamp)
      console.log('timestamp:', timestamp.getFullYear())
      var year = timestamp.getFullYear()
      var month = ("0" + (timestamp.getMonth() + 1)).slice(-2)
      var date = ("0" + timestamp.getDate()).slice(-2)
      var hours = ("0" + timestamp.getHours()).slice(-2)
      var minutes = ("0" + timestamp.getMinutes()).slice(-2)
      var seconds = ("0" + timestamp.getSeconds()).slice(-2)

      list.push({
        date: date +'-'+ month +'-'+ year,
        time: hours +':'+ minutes +':'+ seconds,
        temperature: time.val().temperature,
      })
    })

    const csvFromArrayOfObjects = convertArrayToCSV(list);
    console.log('list:', list)
    console.log('csv From arr obj:', csvFromArrayOfObjects)
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if (status === "granted") {
        let fileUri = FileSystem.documentDirectory + "text.csv";
        await FileSystem.writeAsStringAsync(fileUri, csvFromArrayOfObjects, { encoding: FileSystem.EncodingType.UTF8 });
        const asset = await MediaLibrary.createAssetAsync(fileUri)
        await MediaLibrary.createAlbumAsync("Download", asset, false)
    }
    //console.log('list logs                  :::::', listLogs)
  }
  return(
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center'}}>
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center'}}>
    <Button
          onPress={() => saveLogs()}
          title="download"
          />
    <Text>{devID} {nickname}</Text>
    </View>
    <View style={{ flex: 5, alignItems: 'center', justifyContent: 'center'}}>
    <Text>Time                                                   temperature</Text>
    <FlatList
          data={tempLogs}
          renderItem={({item}) => <Text style={styles.item}>{item.time}                                                   {item.temperature}</Text>}
          keyExtractor={(item, index) => index.toString()}
        />
    </View>  
    </View>
  )
}

function addDevice({route,navigation}){

  const [textID, setTextID] = useState(null);
  const [nickname, setNickname] = useState(null);
  useEffect(() => {
    console.log('textInput',textID)
    console.log('nickname',nickname)
  },[])
  var addButton = async() => {
    const uid = firebase.auth().currentUser.uid;
    const tokenRef = firebase.database().ref(`/user/${uid}/push_token`)
    const snapToken = await tokenRef.once('value')
    console.log('token', snapToken)
    console.log('addButton pressed', textID, nickname)
    const devRef1 = firebase.database().ref(`/user/deviceID/`);
    const snapshot1 = await devRef1.child(`num${textID}`).once('value');   //to check device existence
    const devRef2 = firebase.database().ref(`/user/${uid}/userDevices`);   
    const snapshot2 = await devRef2.child(`dev${textID}`).once('value')      //to check if user 
                                                                        //already added device to his device list
    const ref3 = firebase.database().ref(`/user/deviceID/num${textID}/linkedUser/${uid}`)    
    console.log('snapshot1:', snapshot1.val())                             
    console.log('snapshot2', snapshot2.val())
    var exists1 = (snapshot1.val() !== null);
    var exists2 = (snapshot2.val() !== null);
    console.log('exists1:', exists1, 'exists2:', exists2)
    if(exists1 !== false && exists2 === false){
      ref3.set({
        uid: uid,
        nickname: nickname,
        push_token: snapToken.val(),
        maxTemp: '200',
        minTemp: '-200',
        enableNotification: false
      })
      devRef2.child(`dev${textID}`).update({
        devID: parseInt(textID),
        nickname: nickname,
        timestamp: Date.now(),
      })
      .then(() => {
        navigation.navigate('flatList',{
          refresh: Date.now(),
        })
      })
    }
    
  }
  
  return(
    <View style ={{padding: 10}}>
      <Text>Enter device ID</Text>
      <TextInput
          style={{height: 40}}
          placeholder="Type here to translate!"
          onChangeText={(text) => setTextID(text)}
          value={textID}
      />
      <Text>Enter nickname</Text>
      <TextInput
          style={{height: 40}}
          placeholder="Type here to translate!"
          onChangeText={(text) => setNickname(text)}
          value={nickname}
      />
      <Button
          onPress={() => addButton()}
          title="add Device"
        />


    </View>
  )  
}
function mainSettings(){
  const [toggleSw, setToggleSw] = useState(false);
  const uid = firebase.auth().currentUser.uid;
  const ref1 = firebase.database().ref(`/user/${uid}`)
  useEffect(() => {
    const getNotification = async() =>{
      try {
        const snapshot = await ref1.child('mainEnableNotification').once('value');
        if(snapshot.val())
        {setToggleSw(snapshot.val())}
      }
      catch(err) {
        console.log('err')
      }
    }
    getNotification()
    
  },[])
  return(
  <View style ={{padding: 10}}>
    <ToggleSwitch
      isOn={toggleSw}
      onColor="green"
      offColor="red"
      label="Allow Notification"
      labelStyle={{ color: "black", fontWeight: "900", marginHorizontal: 5 }}
      size="large"
      onToggle={async(isOn) => {
        console.log("changed to : ", isOn)
        setToggleSw(isOn)
        
        await ref1.update({
          mainEnableNotification: isOn,
        })
      }}
      />
      <Text></Text> 
    <Button  title='Sign Out' onPress={()=> firebase.auth().signOut()}/>
  </View>
  )
}



const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function Home({navigation}) {
  var addButtonClick = () =>{
    navigation.navigate('addDevice')
  }
  navigation.setOptions({
    headerRight: () => (
      <MaterialButtonDanger
        addButtonClick = {addButtonClick}
      />
    ),
  });
  return (
    <Tab.Navigator mode="card" >
      <Tab.Screen name="DASHBOARD" 
          component={Games}
          initialParams={{ refresh: 42 }} 
      />
      <Tab.Screen name="MAIN SETTINGS" component={mainSettings} />
    </Tab.Navigator>
  );
}

export default function App() {

  
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Dashboard" component={Home} /> 
        
        <Stack.Screen name="Device Screen" component={deviceScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="FirebaseDemo" component={Role} options={({route}) => ({title: route.params.userId})} />
        
        <Stack.Screen name="addDevice" component={addDevice} />
        <Stack.Screen name="Logs screen" component={logsScreen} />
        <Stack.Screen name="Settings" component={settings} />
        
      </Stack.Navigator>
      
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
   flex: 1,
   paddingTop: 22
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
  
})

/*-----------------------------------------backup 12 mar 2020-------------------------------------------------
export default function App() {

  
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="flatList" 
          component={Games}
          initialParams={{ refresh: 42 }}
          options={({ navigation, route }) => ({
            
          })}
        />
        
        <Stack.Screen name="Device Screen" component={deviceScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="FirebaseDemo" component={Role} options={({route}) => ({title: route.params.userId})} />
        
        <Stack.Screen name="addDevice" component={addDevice} />
        <Stack.Screen name="Logs screen" component={logsScreen} />
        <Stack.Screen name="Settings" component={settings} />
        <Stack.Screen name="Main Settings" component={mainSettings} />
      </Stack.Navigator>
      <Tab.Navigator>
        <Tab.Screen name="dashboard" component={Games} />
        <Tab.Screen name="Main Settings" component={mainSettings} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
*/