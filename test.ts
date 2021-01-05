custom.isConnected()
custom.ctrlLED(COLOR.eLEDYellow, MODE.eFastBlink, 2)
custom.collectionFingerprint(10)
custom.collectionFingerprint(10)
custom.collectionFingerprint(10)
let ID = custom.getEmptyID()
serial.writeValue("x", ID)
custom.storeFingerprint(ID)
basic.forever(function () {
    custom.collectionFingerprint(5)
    if (custom.verify(ID)) {
        custom.ctrlLED(COLOR.eLEDCyan, MODE.eFastBlink, 2)
    } else {
        custom.ctrlLED(COLOR.eLEDMagenta, MODE.eFastBlink, 2)
    }
})
