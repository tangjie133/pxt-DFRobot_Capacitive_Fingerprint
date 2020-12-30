
enum COLOR{
    eLEDGreen = 1,   //green 
    eLEDRed,         //red 
    eLEDYellow,      //yellow
    eLEDBlue,        //blue
    eLEDCyan,        //cyan
    eLEDMagenta,     //magenta
    eLEDWhite        //white
}
enum MODE{
    eBreathing = 1,  //Breathing 
    eFastBlink,      //Quick blink
    eKeepsOn,        //On
    eNormalClose,    //Off
    eFadeIn,         //Fade in 
    eFadeOut,        //Fade out
    eSlowBlink       //Slow blink
}

//% weight=100 color=#0fbc11 icon="\uf26e" block="DFRobot Capacitive Fingerprint"
namespace custom {
    let header:number[] =[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    let readBuffer:number[]=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    const CMD_TEST_CONNECTION=0x0001
    const Addr = 0x1F
    const RCM_TYPE=0xF0
    const DATA_TYPE=0x0F
    const ERR_ID809=0xff
    const ERR_SUCCESS=0x00
    const CMD_SLED_CTRL=0x0024
    const CMD_FINGER_DETECT=0x0021
    const CMD_GET_IMAGE=0x0020
    const CMD_GENERATE=0x0060
    const FINGERPRINT_CAPACITY=80
    const CMD_SEARCH=0x0063
    const CMD_VERIFY=0x0064
    const CMD_GET_EMPTY_ID=0x0045
    const CMD_GET_STATUS=0x0046
    const CMD_GET_ENROLL_COUNT=0x0048
    const CMD_MERGE=0x0061
    const CMD_STORE_CHAR=0x0040
    const DELALL=0xff
    const CMD_DEL_CHAR=0x0044
    let _error,_number=0

    /**
     * @brief Test whether the module connection is ok
    */
    //% block="Wait until is connected"
    export function isConnected(): void {
        while(true){
            pack(CMD_TEST_CONNECTION,null,0);
            let Buffer = pins.createBufferFromArray(header);
            pins.i2cWriteBuffer(Addr, Buffer);
            clearHeader();
            basic.pause(50);
            let ret = responsePayload();
            clearHeader();
            clearReadBuffer();
            if(ret == ERR_SUCCESS){
                break;
            }
        }
    }

    /**
     * @brief Set LED
     * @param mode:in typedef enum eLEDMode_t
     * @param color:in typedef enum eLEDColor_t
     * @param blink Count: 00 represents blinking all the time
     * @This parameter will only be valid in mode eBreathing, eFastBlink, eSlowBlink
     * @return 0(succeed) or ERR_ID809
     */
    //%block="ctrl LED color %color mode %mode count %data"
    export function ctrlLED(color:COLOR,mode:MODE,data:number):void{
        let buf=pins.createBuffer(4);
        buf[0]=mode;
        buf[2]=buf[1]=color;
        buf[3]=data;
        pack(CMD_SLED_CTRL,buf,4);
        let Buffer = pins.createBufferFromArray(header);
        pins.i2cWriteBuffer(Addr, Buffer);
        clearHeader();
        basic.pause(50);
        let buffer = pins.createBuffer(20);
        let ret = responsePayload();
        clearHeader();
        clearReadBuffer();
    }
    /**
     * @brief Detect if there is finger touched 
     * @return ture(Touched) or false(No touch)
     */
    //%block="detectFinger?"
    export function detectFinger():boolean{
        let state=false;
        pack(CMD_FINGER_DETECT,null,0);
        let Buffer = pins.createBufferFromArray(header);
        pins.i2cWriteBuffer(Addr, Buffer);
        clearHeader();
        basic.pause(240);
        let ret = responsePayload();
        if(ret == ERR_SUCCESS) {
            ret = readBuffer[0];
            //serial.writeString("aa:")
            //serial.writeNumber(ret)
        }
        clearHeader();
        clearReadBuffer();
        if(ret==1){
            state=true;
        }
        return state;
    }
    /**
     * @brief Fingerprint acquisition 
     */
    //%block="collection Fingerprint timeout %timeout (s)"
    export function collectionFingerprint(timeout:number):void{
        let i=0,state=0,ret;
        if(_number > 2){
            _error=69;
            return;
        }
        while(!detectFinger()){
            basic.pause(10);
            if(++i > timeout*10){
                state=1;
                break;
            }
        }
        if(state != 1){
            ret=getImage();
            if(ret != ERR_SUCCESS){
                return;
            }
            ret=generate(_number);
            if(ret != ERR_SUCCESS){
                //basic.showIcon(IconNames.No)
               // basic.pause(500);
                //basic.clearScreen();
                return;
            }
            _number++;
        }
    }

    /**
     * @brief Match the fingerprint with all fingeprints 
     * @return Successfully matched fingerprint ID, 0(Matching failed) or ERR_ID809
     */
    //%block="search"
    export function search():number{
        let buf=pins.createBuffer(6)
        buf[2]=1;
        buf[4]=FINGERPRINT_CAPACITY;
        _number=0;
        pack(CMD_SEARCH,buf,6);
        let Buffer = pins.createBufferFromArray(header);
        pins.i2cWriteBuffer(Addr, Buffer);
        clearHeader();
        basic.pause(360);
        let ret = responsePayload();
        if(ret == ERR_SUCCESS){
            ret=readBuffer[0];
        }else{
            ret=0;
        }
        clearHeader();
        clearReadBuffer();
        return ret;
    }
    /**
     * @brief Match the fingerprint with specific fingerprint 
     * @return Successfully matched fingerprint ID, 0(Matching failed) or ERR_ID809
     */
    //%block="verify ID %ID"
    export function verify(ID:number):boolean{
        let state=false;
        let buf=pins.createBuffer(4)
        buf[0]=ID;
        _number=0;
        pack(CMD_VERIFY,buf,4);
        let Buffer = pins.createBufferFromArray(header);
        pins.i2cWriteBuffer(Addr, Buffer);
        clearHeader();
        basic.pause(50);
        let ret = responsePayload();
        if(ret == ERR_SUCCESS){
            //ret=readBuffer[0];
            state=true;
        }
        clearHeader();
        clearReadBuffer();
        return state;
    }
    /**
     * @brief Get the first registerable ID 
     * @return Registerable ID or ERR_ID809
     */
    //%block="get empty ID"
    export function getEmptyID():number{
        let buf=pins.createBuffer(4)
        buf[0]=1;
        buf[2]=FINGERPRINT_CAPACITY;
        pack(CMD_GET_EMPTY_ID,buf,4);
        let Buffer = pins.createBufferFromArray(header);
        pins.i2cWriteBuffer(Addr, Buffer);
        clearHeader();
        basic.pause(100);
        let ret = responsePayload();
        if(ret == ERR_SUCCESS){
            ret=readBuffer[0];
        }
        clearHeader();
        clearReadBuffer();
        return ret;
    }
    /**
     * @brief Check if the ID has been registered 
     * @return 0(Registered), 1(Unregistered) or ERR_ID809
     */
    //%block="get Status ID %ID"
    export function getStatusID(ID:number):boolean{
        let state=false;
        let buf=pins.createBuffer(2)
        buf[0]=ID;
        pack(CMD_GET_STATUS,buf,2);
        let Buffer = pins.createBufferFromArray(header);
        pins.i2cWriteBuffer(Addr, Buffer);
        clearHeader();
        basic.pause(50);
        let ret = responsePayload();
        if(ret == ERR_SUCCESS){
            ret=readBuffer[0];
        }
        if(ret == 0){
            state=true;
        }
        clearHeader();
        clearReadBuffer();
        return state;
    }
    /**
     * @brief Get the number of registered users 
     * @return Number of registered users or ERR_ID809
     */
    //%block="get enroll count"
    export function getEnrollCount():number{
        let buf=pins.createBuffer(4)
        buf[0]=1;
        buf[2]=FINGERPRINT_CAPACITY;
        pack(CMD_GET_ENROLL_COUNT,buf,4);
        let Buffer = pins.createBufferFromArray(header);
        pins.i2cWriteBuffer(Addr, Buffer);
        clearHeader();
        basic.pause(80);
        let ret = responsePayload();
        if(ret == ERR_SUCCESS){
            ret=readBuffer[0];
        }
        clearHeader();
        clearReadBuffer();
        return ret;
    }
    /**
     * @brief Save fingerprint 
     * @param Fingerprint ID
     */
    //%block="store fingerprint %ID"
    export function storeFingerprint(ID:number):void{
        let buf=pins.createBuffer(4)
        let ret;
        ret = merge();
        if(ret != ERR_SUCCESS) {
            return;
        }
        _number=0;
        buf[0]=ID;
        pack(CMD_STORE_CHAR,buf,4);
        let Buffer = pins.createBufferFromArray(header);
        pins.i2cWriteBuffer(Addr, Buffer);
        clearHeader();
        basic.pause(360);
        ret = responsePayload();
        if(ret == ERR_SUCCESS){
            ret=readBuffer[0];
        }
        clearHeader();
        clearReadBuffer();
    }
    /**
     * @brief Delete fingerprint 
     * @param Delete ID or DELALL(delete all)
     */
    //%block="delete fingerprint %ID"
    export function delFingerprint(ID:number):void{
        let buf=pins.createBuffer(4)
        if(ID==DELALL){
            buf[0]=1;
            buf[2]=FINGERPRINT_CAPACITY;
        }else{
            buf[0]=buf[2]=ID;
        }
        buf[0]=1;
        buf[2]=FINGERPRINT_CAPACITY;
        pack(CMD_DEL_CHAR,buf,4);
        let Buffer = pins.createBufferFromArray(header);
        pins.i2cWriteBuffer(Addr, Buffer);
        clearHeader();
        basic.pause(360);
        let ret = responsePayload();
        if(ret == ERR_SUCCESS){
            ret=readBuffer[0];
        }
        clearHeader();
        clearReadBuffer();
    }

    function pack(cmd:number, payload:Buffer,len:number):void{
        header[0]=0x55;
        header[1]=0xAA;
        header[2]=0;
        header[3]=0;
        header[4]=cmd&0xff;
        header[5]=cmd>>8;
        header[6]=len&0xff;
        header[7]=len>>8;
        if(len){
            for(let i=0;i<len;i++){
                header[i+8]= payload[i];
            }
        }  
        let cks = getCmdCKS(len);
        header[24]=cks&0xff;
        header[25]=cks>>8;
        /*
        serial.writeString("header1:")
        for(let i=0;i<26;i++){
            serial.writeNumber(header[i]);
        }*/
    }

    function getCmdCKS(len:number):number{
        let cks =0xff;
        cks += header[2];
        cks += header[3];
        cks += header[4];
        cks += header[5];
        cks += header[6];
        cks += header[7];
        if(len>0){
            for(let i=0; i<len; i++){
                cks += header[i+8];
            }
        }
        return cks;
    }
    function clearHeader():void{
        for(let i=0; i<26;i++){
            header[i]=0;
        }
    }
    function clearReadBuffer():void{
        for(let i=0; i<16;i++){
            readBuffer[i]=0;
        }
    }

    function responsePayload():number{
        let nType = readPrefix();
        if(nType ==1){
            serial.writeString("--recv timeout--")
            _error = 70;
            return ERR_ID809;
        }
        let datCount = readN(16);
        for(let i=0; i<16;i++){
            header[i+10]=readBuffer[i];
        }
        let cks=header[24]|header[25]<<8
        //serial.writeString("cks:")
        //serial.writeNumber(cks);
        let ret=(header[8]|header[9]<<8)&0xff
        //serial.writeString("ret:")
        //serial.writeNumber(ret);
        /*
        serial.writeString("header2:")
        for(let i=0; i<26;i++){
            serial.writeNumber(header[i]);
        }*/
        _error = ret;
        if(ret != ERR_SUCCESS){
            ret=ERR_ID809;
        }else if(datCount != 16){
            _error = 66;
            ret = ERR_ID809;
        }else if(getRcmCKS() != cks){
            _error = 67;
            ret = ERR_ID809;
        }else{
        }
        //serial.writeString("ret:")
        //serial.writeNumber(ret);
        return ret;
    }

    function readPrefix():number{
        const RECV_HEADER_INIT=0
        const RECV_HEADER_AA=1
        const RECV_HEADER_A5=2
        const RECV_HEADER_OK=3
        let ret;
        let state = RECV_HEADER_INIT
        let curr=input.runningTimeMicros();
        while(state != RECV_HEADER_OK){
            let buf=pins.createBuffer(1);
            
            if(readN(1) != 1){
                return 1;
            }
            if((readBuffer[0] == 0xAA) && (state == RECV_HEADER_INIT)) {
                state = RECV_HEADER_AA;
                //serial.writeNumber(state)
                continue;
            } else if((readBuffer[0] == 0xA5) && (state == RECV_HEADER_INIT)) {
                state = RECV_HEADER_A5;
                continue;
            } else if((readBuffer[0] == 0x55) && (state == RECV_HEADER_AA)) {
                state = RECV_HEADER_OK;
                ret = RCM_TYPE;
                //serial.writeNumber(state)
                //serial.writeNumber(ret)
                continue;
            } else if((readBuffer[0] == 0x5A) && (state == RECV_HEADER_A5)) {
                state = RECV_HEADER_OK;
                ret = DATA_TYPE;
                continue;
            } else {
                state = RECV_HEADER_INIT;
                if(readBuffer[0] == 0xAA) {
                    state = RECV_HEADER_AA;
                } else if(readBuffer[0] == 0xA5) {
                    state = RECV_HEADER_A5;
                }
                if(input.runningTimeMicros() - curr > 20000) {
                    serial.writeString("----------!!!!!!!!!recv timeout----------");
                    return 1;
                }  
            }
            
        }
        //serial.writeString("AA55")
        if(ret == RCM_TYPE){
            header[0]=0xAA;
            header[1]=0x55;
        }else if(ret == DATA_TYPE){
            header[0]=0xA5;
            header[1]=0x5A;
        }
        readN(1);
        header[2]=readBuffer[0];
        readN(1);
        header[3]=readBuffer[0];
        readN(2);
        header[4]=readBuffer[0];
        header[5]=readBuffer[1];
        readN(2);
        header[6]=readBuffer[0];
        header[7]=readBuffer[1];
        readN(2);
        header[8]=readBuffer[0];
        header[9]=readBuffer[1];
        return ret;
    }

    function readN(size:number):number{
        let nSize;
        let pBuf;
        if(size>32){
            pBuf=pins.i2cReadBuffer(Addr, 32);
            nSize=32;
        }else{
            pBuf=pins.i2cReadBuffer(Addr, size);
            nSize=size;
        }
        for(let i=0; i<size; i++){
            readBuffer[i]=pBuf[i];
        }
        return nSize;
    }
    function getRcmCKS():number{
        let cks =0xff;
        cks += header[2];
        cks += header[3];
        cks += header[4];
        cks += header[5];
        cks += header[6];
        cks += header[7];
        cks += header[8];
        cks += header[9];
        let len =header[6]|header[7]<<8 
        if(len>0){
            for(let i=0; i<len-2; i++){
                cks += header[i+10];
            }
        }
        //serial.writeString("len:")
        //serial.writeNumber(len);
        //serial.writeString("cks:")
        //serial.writeNumber(cks);
        return cks;
    }
    function getImage():number{
        let ret;
        pack(CMD_GET_IMAGE,null,0);
        let Buffer = pins.createBufferFromArray(header);
        pins.i2cWriteBuffer(Addr, Buffer);
        clearHeader();
        basic.pause(360);
        ret = responsePayload();
        clearHeader();
        clearReadBuffer();
        return ret;
    }
    function generate(RamBufferID:number):number{
        let ret;
        let buf=pins.createBuffer(2);
        buf[0]=RamBufferID;
        pack(CMD_GENERATE,buf,2);
        let Buffer = pins.createBufferFromArray(header);
        pins.i2cWriteBuffer(Addr, Buffer);
        clearHeader();
        basic.pause(360);
        ret = responsePayload();
        clearHeader();
        clearReadBuffer();
        return ret;
    }

    function merge():number{
        let ret;
        let buf=pins.createBuffer(3);
        buf[2]=_number;
        pack(CMD_MERGE,buf,3);
        let Buffer = pins.createBufferFromArray(header);
        pins.i2cWriteBuffer(Addr, Buffer);
        clearHeader();
        basic.pause(360);
        ret = responsePayload();
        clearHeader();
        clearReadBuffer();
        return ret;
    }
}