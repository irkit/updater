package main

import (
	"log"
	"os"
	"time"

	"github.com/tarm/serial"
)

func main() {
	if len(os.Args) != 2 {
		log.Printf("Usage: pulser /dev/tty.usbmodem1421")
		os.Exit(1)
	}
	port := os.Args[1]
	c := &serial.Config{Name: port, Baud: 1200}
	s, err := serial.OpenPort(c)
	if err != nil {
		log.Printf("OpenPort failed, error: ", err)
		os.Exit(1)
	}
	time.Sleep(300 * time.Millisecond)
	if err := s.Flush(); err != nil {
		log.Printf("Flush failed, error: ", err)
		os.Exit(1)
	}
	if err := s.Close(); err != nil {
		log.Printf("Close failed, error: ", err)
		os.Exit(1)
	}
}
