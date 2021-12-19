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
        // The Link methods rely on an injected window.postMessage targeting the
        // IFRAME Web application which in turn communicates with the core Link SDK.
        // The result from the SDK core is finally returned via a call to 
        // window.ReactNativeWebView.postMessage(JSON.stringify(resultObject))
        // residing in the IFRAME Web application.

        // initialise connect flow
        connect(opts) {
            setIsOpen(true)

            SDK.current.injectJavaScript(createCall('connect', opts))
        },

        // initialise link flow
        link(opts) {
            setIsOpen(true)

            SDK.current.injectJavaScript(createCall('link', opts))
        },

        // initialise reconnect flow
        reconnect(opts) {
            setIsOpen(true)

            SDK.current.injectJavaScript(createCall('reconnect', opts))
        },

        // initialise CPS flow
        createPaymentSource(opts) {
            setIsOpen(true)

            SDK.current.injectJavaScript(createCall('createPaymentSource', opts))
        },

        // initialise pay flow
        pay(opts) {
            setIsOpen(true)

            SDK.current.injectJavaScript(createCall('pay', opts))
        },

        // updatePaymentSource flow
        updatePaymentSource(opts) {
            setIsOpen(true)

            SDK.current.injectJavaScript(createCall('updatePaymentSource', opts))
        }
    }));

    const createCall = (method, opts) => {
        let call = `window.postMessage({lean$m:'${method}',argument:\
${JSON.stringify({ ...opts, ...{app_token: props.appToken,sandbox: props.sandbox}})}}, '*');true;`;
//        console.log('call\n' + call);
        return call;
    }

    // The callback fired internally by the SDK to propagate to the user supplied 
    // callback and close the webview.
    const internalCallback = (data) => {
        setTimeout(() => setIsOpen(false), 300)
        if (props.callback) {
            props.callback(JSON.parse(data))
        }
    }

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
//////////////////////////////////////////////////////
// Update HERE to suite the final hosting solution! //
//////////////////////////////////////////////////////
                source={{ uri: 'https://leananders.github.io/clientsdk/' + 
                         (props.version ? props.version : 'latest') + '/websdk.html' }}
                onShouldStartLoadWithRequest={event => {
                    if (event.url !== "https://leantech.me/") {
                        console.log("hello --------------", event.url)
                        Linking.openURL(event.url)
                        return false
                    }
                    return true
                }}
                javaScriptEnabledAndroid={true}
                onMessage={(event)=>{
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

export default LinkSDK