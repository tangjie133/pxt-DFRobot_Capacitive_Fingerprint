input.onButtonPressed(Button.A, function () {
    custom.delFingerprint(ID)
})
let ID = 0
custom.isConnected()
custom.delFingerprint(80)
custom.ctrlLED(COLOR.eLEDYellow, MODE.eFastBlink, 2)
custom.collectionFingerprint(10)
custom.collectionFingerprint(10)
custom.collectionFingerprint(10)
ID = custom.getEmptyID()
serial.writeValue("ID", ID)
custom.storeFingerprint(ID)
serial.writeValue("Number of users", custom.getEnrollCount())
basic.forever(function () {
    custom.collectionFingerprint(10)
    if (custom.verify(ID)) {
        custom.ctrlLED(COLOR.eLEDBlue, MODE.eFastBlink, 2)
    } else {
        custom.ctrlLED(COLOR.eLEDCyan, MODE.eFastBlink, 2)
    }
    serial.writeValue("Match ID", custom.search())
})
