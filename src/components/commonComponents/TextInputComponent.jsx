import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { BLUE } from "../../constants/color";
// import { COMICS, COMICSBOLD } from "../../constant/fontPath";

export const TextInputComponent = ({
    placeholder = "",
    image = "",
    type = "",
    inputdata = "",
    setInputdata = {},
    keyboardType = 'default',
    editable = true,
    borderColor = BLUE,
    maxLength = 100,
    onTouch = "",
    width = "80%",
    autoCapitalize = ""
}) => {
    const [tap, setTap] = useState(false);
    return (
        <Pressable
            onPress={onTouch != "" ? onTouch : () => { }}
            style={{
                ...Styles.container,
                borderWidth: tap ? 2 : 1,
                borderColor: borderColor,
                width: width,
            }}
        >
            {
                (tap || inputdata != "") &&
                <View style={{ ...Styles.lablebackgroud }} >
                    <Text allowFontScaling={false} style={{ ...Styles.lable }}>{placeholder}</Text>
                </View>
            }
            <View style={{ flexDirection: 'row', flex: 1 }}>
                {
                    image != '' &&
                    <View style={{ ...Styles.imgContainer }}>
                        <Image
                            style={{
                                height: 35,
                                width: 35
                            }}
                            source={image}
                        />
                    </View>
                }
                <TextInput
                    secureTextEntry={type === 'password' ? true : false}
                    style={{ ...Styles.txtinput }}
                    onChangeText={(res) => {
                        // console.log(res)
                        if (type == 'name') {
                            if (res[0] != " " && (/[a-zA-Z" "]/.test(res[res.length - 1]))) {
                                setInputdata(res);
                            } else if ((/[a-zA-Z" "]/.test(res[res.length - 1]))) {
                                setInputdata(res.slice(0, 0));
                            } else {
                                setInputdata('');
                            }
                        } else if (type == 'number') {
                            if (res[0] != 0 && (/[0-9]/.test(res[res.length - 1]))) {
                                setInputdata(res);
                            } else if ((/[0-9]/.test(res[res.length - 1]))) {
                                setInputdata(res.slice(0, 0));
                            } else {
                                setInputdata('');
                            }
                        } else if (type == 'email') {
                            if ((/[a-zA-Z@0-9_.-]/.test(res[res.length - 1]))) {
                                setInputdata(res);
                            } else {
                                setInputdata('');
                            }
                        } else if (type == 'password') {
                            if ((/[a-zA-Z0-9@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(res[res.length - 1]))) {
                                setInputdata(res);
                            } else {
                                setInputdata('');
                            }
                        } else {
                            // console.log('others')
                            setInputdata(res);
                        }
                    }}
                    value={inputdata}
                    editable={editable}
                    maxLength={maxLength}
                    keyboardType={keyboardType}
                    placeholder={tap ? "" : placeholder}
                    placeholderTextColor={'gray'}
                    onFocus={() => { setTap(true) }}
                    onEndEditing={() => { setTap(false) }}
                    autoCapitalize={autoCapitalize}
                />
            </View>
        </Pressable>
    )
}
const Styles = StyleSheet.create({
    container: {
        height: 60,//width * 0.8,
        backgroundColor: "white",
        margin: 10,
        borderRadius: 15,
        borderWidth: 1,
        elevation: 5
    }, lable: {
        color: "black",//BLACK,
        // fontFamily:"Roboto-Medium",
        // fontFamily: COMICSBOLD
        fontWeight: "bold"
    }, lablebackgroud: {
        backgroundColor: "white",
        top: -10,
        left: 10,
        justifyContent: "center",
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 5,
        position: 'absolute',
        borderRadius: 10
    }, imgContainer: {
        marginLeft: 10,
        justifyContent: "center",
        alignItems: 'center',
    }, txtinput: {
        flex: 1,
        marginLeft: 10,
        // fontFamily: COMICS,
        fontWeight: "bold",
        color: "black",
        // fontFamily:ROBOTO_REGULAR
    }
})