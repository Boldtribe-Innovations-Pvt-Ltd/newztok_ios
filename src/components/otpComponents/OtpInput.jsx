import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { COMICSBOLD } from "../../constant/fontPath";
import { BLACK, BLUE, WHITE } from "../../constants/color";

export const OtpInput = ({ onOtpChange }) => {
    const [otp, setOtp] = useState(['', '', '', '']);
    const [focusedInput, setFocusedInput] = useState(null);
    const inputRefs = useRef([]);

    useEffect(() => {
        onOtpChange(otp.join(''));
    }, [otp]);

    const handleChange = (value, index) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 3) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleFocus = (index) => {
        setFocusedInput(index);
    };

    const handleBlur = () => {
        setFocusedInput(null);
    };

    const handleKeyPress = (event, index) => {
        if (event.nativeEvent.key === 'Backspace' && otp[index] === '') {
            if (index > 0) {
                inputRefs.current[index - 1].focus();
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
            }
        }
    };

    return (
        <View style={styles.container}>
            {otp.map((digit, index) => (
                <TextInput
                    key={index}
                    value={digit}
                    onChangeText={(value) => handleChange(value, index)}
                    onKeyPress={(event) => handleKeyPress(event, index)}
                    onFocus={() => handleFocus(index)}
                    onBlur={handleBlur}
                    style={[
                        styles.input,
                        focusedInput === index && styles.inputFocused,
                    ]}
                    keyboardType="numeric"
                    maxLength={1}
                    ref={(el) => (inputRefs.current[index] = el)}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 20,
    },
    input: {
        width: 50,
        height: 50,
        borderBottomWidth: 1,
        borderColor: BLUE,
        textAlign: 'center',
        fontSize: 18,
        marginHorizontal: 5,
        color: BLACK,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        elevation: 5,
        backgroundColor: WHITE,
        // fontFamily: COMICSBOLD,
    },
    inputFocused: {
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 1,
        borderColor: BLUE,
    },
});
