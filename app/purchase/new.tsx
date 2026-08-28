import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Field, PrimaryButton, Screen, SectionTitle } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { colors, radius } from '@/theme';
import { calculatePurchaseTotal } from '@/domain/rules';
import { money } from '@/utils/format';

export default function PurchaseScreen(){
  const {data,session,registerPurchase}=useApp(); const [supplier,setSupplier]=useState(''); const[cnpj,setCnpj]=useState('');const[invoice,setInvoice]=useState('');const[epiId,setEpiId]=useState(data.epis[0]?.id??'');const[quantity,setQuantity]=useState('1');const[unitValue,setUnitValue]=useState(String(data.epis[0]?.unitValue??0));const[documentUri,setDocumentUri]=useState<string|undefined>();const[documentName,setDocumentName]=useState('Nenhum documento anexado');const[saving,setSaving]=useState(false);
  const item={epiId,quantity:Number(quantity),unitValue:Number(unitValue.replace(',','.'))}; let total=0;try{total=calculatePurchaseTotal([item])}catch{}
  if(session?.role!=='admin') return <Screen><Field label="Acesso" value="Somente administradores registram compras." editable={false}/></Screen>;
  const pick=async()=>{const result=await DocumentPicker.getDocumentAsync({copyToCacheDirectory:true,multiple:false});if(!result.canceled){setDocumentUri(result.assets[0]?.uri);setDocumentName(result.assets[0]?.name??'Documento anexado');}};
  const save=async()=>{if(!supplier.trim()||!cnpj.trim()||!invoice.trim()||!epiId||item.quantity<=0||item.unitValue<0)return Alert.alert('Compra incompleta','Preencha fornecedor, CNPJ, nota fiscal, EPI, quantidade e valor.');setSaving(true);await registerPurchase({supplier,cnpj,invoice,items:[item],documentUri});setSaving(false);Alert.alert('Compra registrada',`Entrada de ${item.quantity} unidade(s) registrada. Total ${money(total)}.`,[{text:'OK',onPress:()=>router.back()}]);};
  return <Screen><Field label="Fornecedor" value={supplier} onChangeText={setSupplier}/><Field label="CNPJ" value={cnpj} onChangeText={setCnpj}/><Field label="Nota fiscal" value={invoice} onChangeText={setInvoice}/><SectionTitle>Item da compra</SectionTitle><View style={{gap:8}}>{data.epis.map(e=><Pressable key={e.id} onPress={()=>{setEpiId(e.id);setUnitValue(String(e.unitValue));}} style={[styles.choice,epiId===e.id&&styles.active]}><Text style={[styles.choiceText,epiId===e.id&&styles.activeText]}>{e.name}</Text><Text style={styles.meta}>Atual {e.stock} • {money(e.unitValue)}</Text></Pressable>)}</View><Field label="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="number-pad"/><Field label="Valor unitário" value={unitValue} onChangeText={setUnitValue} keyboardType="decimal-pad"/><Card><Text style={styles.total}>Total: {money(total)}</Text></Card><Pressable onPress={pick} style={styles.attach}><Text style={styles.attachText}>Anexar documento do dispositivo</Text><Text style={styles.meta}>{documentName}</Text></Pressable><PrimaryButton label="Registrar compra e entrada" icon="cart" loading={saving} onPress={save}/></Screen>;
}
const styles=StyleSheet.create({choice:{padding:13,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:'#fff'},active:{borderColor:colors.blue,backgroundColor:'#EAF1FF'},choiceText:{fontWeight:'800',color:colors.text},activeText:{color:colors.blue},meta:{color:colors.muted,fontSize:12,marginTop:3},total:{fontWeight:'900',fontSize:18,color:colors.text},attach:{padding:14,borderRadius:radius.md,borderWidth:1,borderStyle:'dashed',borderColor:'#AFC5FF',backgroundColor:'#F5F8FF'},attachText:{color:colors.blue,fontWeight:'900'}});
