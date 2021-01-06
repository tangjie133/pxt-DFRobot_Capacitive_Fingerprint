custom.isConnected()
custom.delFingerprint(80)
custom.ctrlLED(COLOR.eLEDYellow, MODE.eFastBlink, 2)
custom.collectionFingerprint(10)
custom.collectionFingerprint(10)
custom.collectionFingerprint(10)
let ID = custom.getEmptyID()
custom.storeFingerprint(ID)
serial.writeValue("ID", ID)
serial.writeValue("Number of users", custom.getEnrollCount())
basic.forever(function () {
    custom.collectionFingerprint(10)
    serial.writeValue("state", custom.search())
    if (custom.verify(ID)) {
        custom.ctrlLED(COLOR.eLEDBlue, MODE.eFastBlink, 2)
    } else {
        custom.ctrlLED(COLOR.eLEDCyan, MODE.eFastBlink, 2)
    }
})
