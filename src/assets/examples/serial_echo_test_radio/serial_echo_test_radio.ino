// Serial echo test for gcgui (app -> device -> app).
// Upload to Arduino, select the port at 115200.
// Every byte received is written straight back out immediately: no
// buffering, no waiting for a newline. Per-key presses from the Key Send
// widget or the Key Button widget echo back instantly.
//
// Note: gcgui's Raw Serial view only renders complete newline-terminated
// lines, so lone echoed chars become visible once a newline arrives. For a
// per-key reply that shows up in the app immediately, use
// key_command_test.ino instead (it answers each key with an ACK line).
//
// note: in this alternate version, I have written it so that the radio
// will ping back instead. should be identical to the other test (src/assets/examples/serial_echo_test),
// but that one was designed for usb tethering instead of radio pinging.
// note the alternate baud rate and the use of Serial2 instead of Serial

void setup() {
  Serial2.begin(57600);
  while (!Serial2) {
    ; // wait for USB serial on Leonardo/Micro-style boards
  }
  Serial2.println("# serial_echo_test ready. Bytes are echoed immediately.");
}

void loop() {
    if (Serial2.available() > 0) {
        // Read the incoming byte
        char incomingByte = Serial2.read();

        // Echo the exact byte back to the serial port
        Serial2.write(incomingByte);
      }
}
