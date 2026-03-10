import React from "react";
import styles from "./InputForm.module.css";

interface InputFormProps {
  names: string;
  pl: string;
}

const InputForm = ({
    pl,
    names,
}: InputFormProps) =>{
    return(
        <input 
          placeholder={pl}
          className={styles.input}
          name={names}
        />
    );
};

export default InputForm;
