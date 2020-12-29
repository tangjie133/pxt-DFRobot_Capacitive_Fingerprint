// 在此处添加您的代码
/**
 * 自定义图形块 f26e
 */
//% weight=100 color=#0fbc11 icon="\uf26e" block="DFRobot Capacitive Fingerprint"
namespace custom {
    let header:number[] =[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]

    const CMD_TEST_CONNECTION=0x0001
    const Addr = 0x1F
    const RCM_TYPE=0xF0
    const DATA_TYPE=0x0F
    const ERR_ID809=0xff;
    let _error

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
            basic.pause(1000);
            let buf = pins.createBuffer(20);
            
        }
       
    }


    function pack(cmd:number, payload:Buffer,len:number):void{
        header[0]=0x55;
        header[1]=0xAA;
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

    function responsePayload(buf:Buffer):number{
        let nType = readPrefix();
        if(nType ==1){
            serial.writeString("--recv timeout--")
            _error = 70;
            return ERR_ID809;
        }
        let buffer=pins.createBuffer(16);
        let datCount = readN(buffer,16);
        for(let i=0; i<16;i++){
            header[i+10]=buffer[i];
        }
        let cks=(header[24]|header[25<<8])
        let ret=(header[8]+header[9]<<8)&0xff
        return 1;
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
            if(readN(buf,1) != 1){
                return 1;
            }
            if((buf[0] == 0xAA) && (state == RECV_HEADER_INIT)) {
                state = RECV_HEADER_AA;
                continue;
            } else if((buf[0] == 0xA5) && (state == RECV_HEADER_INIT)) {
                state = RECV_HEADER_A5;
                continue;
            } else if((buf[0] == 0x55) && (state == RECV_HEADER_AA)) {
                state = RECV_HEADER_OK;
                ret = RCM_TYPE;
                continue;
            } else if((buf[0] == 0x5A) && (state == RECV_HEADER_A5)) {
                state = RECV_HEADER_OK;
                ret = DATA_TYPE;
                continue;
            } else {
                state = RECV_HEADER_INIT;
                if(buf[0] == 0xAA) {
                    state = RECV_HEADER_AA;
                } else if(buf[0] == 0xA5) {
                    state = RECV_HEADER_A5;
                }
                if(input.runningTimeMicros() - curr > 2000) {
                    serial.writeString("----------!!!!!!!!!recv timeout----------");
                    return 1;
                }  
            }
        }
        if(ret == RCM_TYPE){
            header[0]=0xAA;
            header[1]=0x55;
        }else if(ret == DATA_TYPE){
            header[0]=0xA5;
            header[1]=0x5A;
        }
        let buf = pins.createBuffer(2)
        readN(buf,1);
        header[2]=buf[0];
        readN(buf,1);
        header[3]=buf[0];
        readN(buf,2);
        header[4]=buf[0];
        header[5]=buf[1];
        readN(buf,2);
        header[6]=buf[0];
        header[7]=buf[1];
        readN(buf,2);
        header[8]=buf[0];
        header[9]=buf[1];

        return ret;
    }

    function readN(pBuf:Buffer,size:number):number{
        let nSize;
        if(size>32){
            pBuf=pins.i2cReadBuffer(Addr, 32);
            nSize=32;
        }else{
            pBuf=pins.i2cReadBuffer(Addr, size);
            nSize=size;
        }
        return nSize;
    }

}