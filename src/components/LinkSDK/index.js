import React, { useRef, useImperativeHandle, useState, forwardRef } from 'react'
import { WebView } from 'react-native-webview'
import { Dimensions, View, StyleSheet, Linking } from 'react-native'


const LinkSDK = forwardRef((props, ref) => {
    // create a ref for injectJavaScript to use
    const SDK = useRef(null)

    // create state to manage SDK visibility
    const [isOpen, setIsOpen] = useState(false)

    // useImperativeHandle allows the methods to be called outside of the component
    useImperativeHandle(ref, () => ({
        // The Link methods rely on an injected window.postMessage targeting
        // a Web application which in turn communicates with the core Link SDK.
        // The result from the SDK core is finally returned via a call to 
        // window.ReactNativeWebView.postMessage(JSON.stringify(resultObject))
        // residing in the Web application.

        // initialise link flow
        link(opts) {
            createCall('link', opts)
        },

        // initialise connect flow
        connect(opts) {
            createCall('connect', opts)
        },

        // initialise reconnect flow
        reconnect(opts) {
            createCall('reconnect', opts)
        },

        // initialise CPS flow
        createPaymentSource(opts) {
            createCall('createPaymentSource', opts)
        },

        // updatePaymentSource flow
        updatePaymentSource(opts) {
            createCall('updatePaymentSource', opts)
        },

        // initialise pay flow
        pay(opts) {
            createCall('pay', opts)
        }
    }));

    const createCall = (method, opts) => {
        setIsOpen(true)
        let call = `window.postMessage({lean$m:'${method}',argument:\
${JSON.stringify({ ...opts, ...{app_token: props.appToken,sandbox: props.sandbox}})}}, '*');true;`;
//        console.log('call\n' + call);
        SDK.current.injectJavaScript(call);
    }

    // The callback fired internally by the SDK to propagate to the user supplied 
    // callback and close the webview.
    const internalCallback = (data) => {
        setTimeout(() => setIsOpen(false), 300)
        if (props.callback) {
            props.callback(JSON.parse(data))
        }
    }

    //////////////////////////////////////////////////////
    // Update HERE to suite the final hosting solution! //
    //////////////////////////////////////////////////////
    const hostpath = props.hostpath ?
                     props.hostpath : 'https://leananders.github.io/clientsdk/'; 

    return (
        <View
            style={isOpen ? styles.container : styles.containerClosed}
            height={Dimensions.get('window').height}
            width={Dimensions.get('window').width}
        >
            <WebView
                {...props.webViewProps}
                ref={SDK}
                style={styles.WebView}
                originWhitelist={['*']}
                source={{ uri: hostpath + 
                         (props.version ? props.version : 'latest') + '/websdk.html' }}
                onShouldStartLoadWithRequest={event => {
                    if (event.url.startsWith(hostpath) || event.url == "about:srcdoc") {
                        return true
                    }
                    console.log("hello --------------", event.url)
                    Linking.openURL(event.url)
                    return false
                }}
                onMessage={(event)=> {
                    internalCallback(event.nativeEvent.data);
                }}
            />
        </View>
    )
})

LinkSDK.defaultProps = {
    webViewProps: {}
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        zIndex: 2
    },
    containerClosed: {
        display: 'none',
        position: 'relative',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        zIndex: 2
    },
    WebView: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',  
        backgroundColor: 'transparent',
        zIndex: 100
    },
});

export default LinkSDK;
