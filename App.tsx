import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Button,
  TextInput,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';

import {Picker} from '@react-native-picker/picker';

import {
  InterfaceType,
  StarConnectionSettings,
  StarXpandCommand,
  StarPrinter,
  StarDeviceDiscoveryManager,
  StarDeviceDiscoveryManagerFactory,
} from 'react-native-star-io10';

const App = () => {
  const [interfaceType, setInterfaceType] = useState<InterfaceType>(
    InterfaceType.Lan,
  );
  const [identifier, setIdentifier] = useState<string>('00:11:62:00:00:00');
  const [imageBase64, setImageBase64] = useState<string>('');

  let _manager: StarDeviceDiscoveryManager;

  const _onPressPrintButton = async () => {
    Alert.alert(JSON.stringify('onPressPrint' + identifier + interfaceType));
    var settings = new StarConnectionSettings();
    settings.interfaceType = interfaceType;
    settings.identifier = identifier;
    // settings.autoSwitchInterface = true;

    // If you are using Android 12 and targetSdkVersion is 31 or later,
    // you have to request Bluetooth permission (Nearby devices permission) to use the Bluetooth printer.
    // https://developer.android.com/about/versions/12/features/bluetooth-permissions
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      if (
        interfaceType === InterfaceType.Bluetooth ||
        settings.autoSwitchInterface === true
      ) {
        var hasPermission = await _confirmBluetoothPermission();

        if (!hasPermission) {
          console.log(
            `PERMISSION ERROR: You have to allow Nearby devices to use the Bluetooth printer`,
          );
          return;
        }
      }
    }

    var printer = new StarPrinter(settings);

    try {
      var builder = new StarXpandCommand.StarXpandCommandBuilder();
      builder.addDocument(
        new StarXpandCommand.DocumentBuilder().addPrinter(
          new StarXpandCommand.PrinterBuilder()
            // .actionPrintImage(new StarXpandCommand.Printer.ImageParameter("logo_01.png", 406))
            .styleInternationalCharacter(
              StarXpandCommand.Printer.InternationalCharacterType.Usa,
            )
            .styleCharacterSpace(0)
            .styleAlignment(StarXpandCommand.Printer.Alignment.Center)
            .actionPrintText(
              'Star Clothing Boutique\n' +
                '123 Star Road\n' +
                'City, State 12345\n' +
                '\n',
            )
            .styleAlignment(StarXpandCommand.Printer.Alignment.Left)
            .actionPrintText(
              'Date:MM/DD/YYYY    Time:HH:MM PM\n' +
                '--------------------------------\n' +
                '\n',
            )
            .actionPrintText(
              'SKU         Description    Total\n' +
                '300678566   PLAIN T-SHIRT  10.99\n' +
                '300692003   BLACK DENIM    29.99\n' +
                '300651148   BLUE DENIM     29.99\n' +
                '300642980   STRIPED DRESS  49.99\n' +
                '300638471   BLACK BOOTS    35.99\n' +
                '\n' +
                'Subtotal                  156.95\n' +
                'Tax                         0.00\n' +
                '--------------------------------\n',
            )
            .actionPrintText('Total     ')
            .add(
              new StarXpandCommand.PrinterBuilder()
                .styleMagnification(
                  new StarXpandCommand.MagnificationParameter(2, 2),
                )
                .actionPrintText('   $156.95\n'),
            )
            .actionPrintText(
              '--------------------------------\n' +
                '\n' +
                'Charge\n' +
                '156.95\n' +
                'Visa XXXX-XXXX-XXXX-0123\n' +
                '\n',
            )
            .add(
              new StarXpandCommand.PrinterBuilder()
                .styleInvert(true)
                .actionPrintText('Refunds and Exchanges\n'),
            )
            .actionPrintText('Within ')
            .add(
              new StarXpandCommand.PrinterBuilder()
                .styleUnderLine(true)
                .actionPrintText('30 days'),
            )
            .actionPrintText(' with receipt\n')
            .actionPrintText('And tags attached\n' + '\n')
            .styleAlignment(StarXpandCommand.Printer.Alignment.Center)
            .actionPrintBarcode(
              new StarXpandCommand.Printer.BarcodeParameter(
                '0123456',
                StarXpandCommand.Printer.BarcodeSymbology.Jan8,
              )
                .setBarDots(3)
                .setBarRatioLevel(
                  StarXpandCommand.Printer.BarcodeBarRatioLevel.Level0,
                )
                .setHeight(5)
                .setPrintHri(true),
            )
            .actionFeedLine(1)
            .actionPrintQRCode(
              new StarXpandCommand.Printer.QRCodeParameter('Hello World.\n')
                .setModel(StarXpandCommand.Printer.QRCodeModel.Model2)
                .setLevel(StarXpandCommand.Printer.QRCodeLevel.L)
                .setCellSize(8),
            )
            .actionCut(StarXpandCommand.Printer.CutType.Partial),
        ),
      );

      var commands = await builder.getCommands();

      await printer.open();
      await printer.print(commands);
      Alert.alert(JSON.stringify('Success'));
      console.log(`Success`);
    } catch (error) {
      Alert.alert(JSON.stringify(error));
      console.log(`Error: ${String(error)}`);
    } finally {
      await printer.close();
      await printer.dispose();
    }
  };

  const _confirmBluetoothPermission = async (): Promise<boolean> => {
    var hasPermission = false;

    try {
      hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      );

      if (!hasPermission) {
        const status = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        );

        hasPermission = status == PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn(err);
    }

    return hasPermission;
  };

  const discover: Function = async (): Promise<void> => {
    try {
      // Specify your printer interface types.
      _manager = await StarDeviceDiscoveryManagerFactory.create([
        InterfaceType.Lan,
        InterfaceType.Bluetooth,
        // InterfaceType.BluetoothLE,
        InterfaceType.Usb,
      ]);
      console.log('coming here?', _manager);
      // Set discovery time. (option)
      _manager.discoveryTime = 10000;

      // Callback for printer found.
      _manager.onPrinterFound = (printer: StarPrinter) => {
        Alert.alert(JSON.stringify(printer));
        console.log('printer', printer);
      };

      // Callback for discovery finished. (option)
      _manager.onDiscoveryFinished = () => {
        Alert.alert(JSON.stringify('discovery Finished'));
        console.log(`Discovery finished.`);
      };

      // Start discovery.
      await _manager.startDiscovery();

      // Stop discovery.
      // await manager.stopDiscovery()
    } catch (error) {
      // Error.
      Alert.alert(JSON.stringify('catch error ' + error));
      console.log(error);
    }
  };

  const getStatus = async (): Promise<void> => {
    // Specify your printer connection settings.
    var settings = new StarConnectionSettings();
    settings.interfaceType = interfaceType;
    settings.identifier = identifier;
    var printer = new StarPrinter(settings);

    try {
      // Connect to the printer.
      await printer.open();

      // Get printer status.
      var status = await printer.getStatus();
      Alert.alert(JSON.stringify(status));
      console.log(status);
    } catch (error) {
      // Error.
      Alert.alert(JSON.stringify(error));
      console.log(error);
    } finally {
      // Disconnect from the printer and dispose object.
      await printer.close();
      await printer.dispose();
    }
  };

  useEffect(() => {
    _confirmBluetoothPermission();
  }, []);

  return (
    <View style={{margin: 50}}>
      <View style={{flexDirection: 'row'}}>
        <Text style={{width: 100}}>Interface</Text>
        <Picker
          style={{width: 200, marginLeft: 20, justifyContent: 'center'}}
          selectedValue={interfaceType}
          onValueChange={(value) => {
            setInterfaceType(value);
          }}>
          <Picker.Item label="LAN" value={InterfaceType.Lan} />
          <Picker.Item label="Bluetooth" value={InterfaceType.Bluetooth} />
          <Picker.Item label="Bluetooth LE" value={InterfaceType.BluetoothLE} />
          <Picker.Item label="USB" value={InterfaceType.Usb} />
        </Picker>
      </View>
      <View style={{flexDirection: 'row', marginTop: 30}}>
        <Text style={{width: 100}}>Identifier</Text>
        <TextInput
          style={{width: 200, marginLeft: 20}}
          value={identifier}
          onChangeText={(value) => {
            setIdentifier(value);
          }}
        />
      </View>
      <View style={{width: 100, marginTop: 20}}>
        <Button title="Print" onPress={_onPressPrintButton} />
        <Button title="Discover" onPress={discover} />
        <Button title="status" onPress={getStatus} />
      </View>
    </View>
  );
};

export default App;
