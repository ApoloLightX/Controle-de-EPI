import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Field, PrimaryButton, Screen } from '@/components/UI';
import { useApp } from '@/context/AppContext';

export default function NewEpi(){
  const {session,addEpi}=useApp();
  const [name,setName]=useState('');const[category,setCategory]=useState('');const[brand,setBrand]=useState('');const[model,setModel]=useState('');const[size,setSize]=useState('Único');const[ca,setCa]=useState('');const[caValidity,setCaValidity]=useState('2027-12-31');const[stock,setStock]=useState('0');const[minStock,setMinStock]=useState('5');const[unitValue,setUnitValue]=useState('0');const[supplier,setSupplier]=useState('');const[saving,setSaving]=useState(false);
  if(session?.role!=='admin') return <Screen><Field label="Acesso" value="Somente administradores podem cadastrar EPIs." editable={false}/></Screen>;
  const save=async()=>{if(!name||!category||!brand||!ca||!supplier)return Alert.alert('Campos obrigatórios','Preencha nome, categoria, marca, CA e fornecedor.');const s=Number(stock.replace(',','.')),m=Number(minStock.replace(',','.')),v=Number(unitValue.replace(',','.'));if(!Number.isFinite(s)||!Number.isFinite(m)||!Number.isFinite(v))return Alert.alert('Valores inválidos','Confira estoque, mínimo e valor unitário.');setSaving(true);await addEpi({name,category,brand,model,size,ca,caValidity,stock:s,minStock:m,unitValue:v,supplier});setSaving(false);router.back();};
  return <Screen><View style={{gap:14}}><Field label="Nome do EPI" value={name} onChangeText={setName}/><Field label="Categoria" value={category} onChangeText={setCategory}/><Field label="Marca" value={brand} onChangeText={setBrand}/><Field label="Modelo" value={model} onChangeText={setModel}/><Field label="Tamanho" value={size} onChangeText={setSize}/><Field label="CA" value={ca} onChangeText={setCa} keyboardType="number-pad"/><Field label="Validade do CA (AAAA-MM-DD)" value={caValidity} onChangeText={setCaValidity}/><Field label="Estoque atual" value={stock} onChangeText={setStock} keyboardType="number-pad"/><Field label="Estoque mínimo" value={minStock} onChangeText={setMinStock} keyboardType="number-pad"/><Field label="Valor unitário" value={unitValue} onChangeText={setUnitValue} keyboardType="decimal-pad"/><Field label="Fornecedor" value={supplier} onChangeText={setSupplier}/><PrimaryButton label="Cadastrar EPI" icon="checkmark" loading={saving} onPress={save}/></View></Screen>;
}
