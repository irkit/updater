var util       = require("util")
,   serialport = require("serialport")
,   _          = require("underscore")
,   async      = require("async")
,   l          = require("nlogger").logger(module)
,   spawn      = require("child_process").spawn
,   fs         = require("fs")
;

module.exports = {
    runAVRDUDE: function(command, args, logfilename, callback) {
        l.info( "will run: " + command + " " + args.join(" ") );

        var is_writing_via_usb = args.join(' ').match( /avr109/ ) ? 1 : 0;

        var avrdude = spawn(command, args, { stdio: [ "ignore", process.stdout, "pipe" ] });
        var all = "";
        avrdude.stderr.on("data", function(data) {
            process.stdout.write(data);
            process.stderr.write(".");

            // logLooksFine function will log if error

            all += data.toString("utf-8");
            if ( all.match(/can't open device/) ) {
                avrdude.kill();
            }
            else if ( all.match(/programmer is not responding/) ) {
                // don't wait until retry fails
                avrdude.kill();
            }
        });
        avrdude.on("close", function(code) {
            if ( code ) {
                logLooksFine(logfilename, is_writing_via_usb); // for error message
                callback( code );
                return;
            }
            if ( ! logLooksFine(logfilename, is_writing_via_usb) ) {
                callback( 1 );
                return;
            }
            callback( null );
        });
        avrdude.on("error", function(err) {
            log( err.toString() );
        });
    },
    pulseDTRAndWaitForNewPort: function(port_name, wait_milliseconds, callback) {
        serialport.list( function(err, before_ports) {
            l.info( "before: ", _.pluck(before_ports,"comName") );
            
            var found = _.find(before_ports, function(before_port) {
                return before_port.comName === port_name;
            });
            if (! found) {
                var message = "no port: " + port_name + " found";
                l.error( message );
                console.error( message );
                callback( message );
                return;
            }

            pulseDTR( port_name, function(err) {
                if (err) {
                    callback( err );
                    return;
                }
                waitForNewSerialPort( before_ports, wait_milliseconds, function(err, port) {
                    if (err) {
                        l.error( err );
                        console.error( err );
                        callback( err );
                        return;
                    }
                    if (! port) {
                        var message = "port not found within " + wait_milliseconds/1000 + " seconds";
                        l.error( message );
                        console.error( message );
                        callback( message );
                        return;
                    }

                    l.info( "detected new serialport: " + port.comName );
                    callback( null, port.comName );
                });
            });
        });
    }
};

function logLooksFine (filename, is_writing_via_usb) {
    var output = fs.readFileSync( filename, "utf-8" );

    var ng_patterns = [
        {
            pattern: /programmer is not responding/,
            message: "6ピンの接触を確認して、検査機の電源を入れ直してください"
        },
        {
            pattern: /write error: sorry no info avail/,
            message: "パソコンを再起動してください"
        },
        {
            pattern: /can't set com\-state/,
            message: "検査機の電源を入れ直してください"
        },
        {
            pattern: /can't open device/,
            message: "もう一度検査を行ってください。連続してこのメッセージが出るようであればパソコンを再起動してください"
        },
        {
            pattern: /protocol error/,
            message: "6ピンの接触を確認して、検査機の電源を入れ直してください"
        },
        {
            pattern: /Invalid device signature/,
            message: "6ピンの接触を確認してください"
        },
        {
            pattern: /not in sync/,
            message: "6ピンの接触を確認してください"
        },
        {
            pattern: /may not be reliable/,
            message: "6ピンの接触を確認してください"
        },
        {
            pattern: /Double check chip/,
            message: "6ピンの接触を確認してください"
        }
    ];
    for (var i=0; i<ng_patterns.length; i++) {
        if (output.match(ng_patterns[ i ].pattern)) {
            if (! is_writing_via_usb) {
                log( ng_patterns[ i ].message );
            }
            else {
                // usb's contact must be stable
                log( "もう一度検査を行ってください。連続してこのメッセージが出るようであればパソコンを再起動してください" );
            }
            return 0;
        }
    }
    l.info( "log looks fine, avrdude successfully finished" );
    return 1;
}

function waitForNewSerialPort (before_ports, wait_milliseconds, callback) {
    var til = (new Date()).getTime() + wait_milliseconds;

    var new_port, serialport_err, ports = before_ports;
    async.until(
        function () {
            new_port = _.find( ports, function(port) {
                return _.every( before_ports, function(before_port) {
                    return before_port.comName !== port.comName;
                });
            });
            if (new_port) {
                l.info( "new port found: ", new_port );
                return true;
            }

            var now = (new Date()).getTime();
            if (now > til) {
                return true;
            }
            // Keep track of port that disappears
            before_ports = ports;
            return false;
        },
        function (callback) {
            console.log(".");
            console.error(".");
            setTimeout( function() {
                serialport.list( function(err, ports_) {
                    l.info( "ports: ", util.format("%j",ports_) );

                    serialport_err = err;
                    ports          = ports_;
                    callback();
                });
            }, 250 );
        },
        function (err) {
            callback( err, new_port );
        }
    );
}

function pulseDTR( port_name, callback ) {
    l.info( "will pulse: ", port_name );
    var serial = new serialport.SerialPort( port_name, {
        baudRate: 1200
    });
    serial.on( "open", function() {
        setTimeout( function() {
            serial.close( function(err) {
                callback( err );
            });

            // 0.3 comes from AvrdudeUploader.java
            // Scanning for available ports seems to open the port or
            // otherwise assert DTR, which would cancel the WDT reset if
            // it happened within 250 ms.  So we wait until the reset should
            // have already occured before we start scanning.
        }, 0.3 * 1000 );
    });
    serial.on("error", function(error) {
        log( error );
        callback(error);
    });
}

function log() {
    console.log.apply( console, arguments );
    console.error.apply( console, arguments );
}
