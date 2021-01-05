# HuskyLens

[This capacitive fingerprint sensor supports fingerprint capture, image processing, fingerprint storage, fingerprint comparison and so on. Taking ID809 high-performance processor and semiconductor fingerprint sensor as the core, the sensor adopts built-in IDfinger6.0 algorithm, which can complete all fingerprint identification work independently.](https://www.dfrobot.com/product-2165.html)
## Basic usage

* HuskyLens Init I2C and select pattern.

```blocks

    huskylens.initI2c()
    huskylens.initMode(protocolAlgorithm.ALGORITHM_FACE_RECOGNITION)

```

* HuskyLens requests the data and stores the requested data in the result for later use.

```blocks

    basic.forever(function () {
        huskylens.request()
    })

```

* HuskyLens retrieves the desired result from the result (For example, get the X center of the ID1 box).

```blocks

    huskylens.initI2c()
    huskylens.initMode(protocolAlgorithm.ALGORITHM_FACE_RECOGNITION)
    basic.forever(function () {
        huskylens.request()
        if (huskylens.isLearned(1)) {
            if (huskylens.isAppear(1, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) {
                serial.writeValue("box", huskylens.readeBox(1, Content1.xCenter))
            }
        }
    })

```

* HuskyLens retrieves the parameters of the center box on the screen from the result.

```blocks

    huskylens.initI2c()
    huskylens.initMode(protocolAlgorithm.ALGORITHM_FACE_RECOGNITION)
    basic.forever(function () {
        huskylens.request()
        serial.writeValue("box", huskylens.readBox_s(Content3.ID))
    })

```

* HuskyLens gets the parameters of the Nth box from the result.

```blocks
    huskylens.initI2c()
    huskylens.initMode(protocolAlgorithm.ALGORITHM_FACE_RECOGNITION)
    basic.forever(function () {
        huskylens.request()
        serial.writeValue("box", huskylens.readBox_ss(1, Content3.ID))
    })

```
## License

MIT

Copyright (c) 2020, microbit/micropython Chinese community  

## Supported targets

* for PXT/microbit