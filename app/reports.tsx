import * as FileSystem from 'expo-file-system/legacy';
import { Alert, StyleSheet, Text } from 'react-native';
import { Card, PrimaryButton, Screen, SectionTitle } from '@/components/UI';
import { useApp } from '@/context/AppContext';
import { exportConsolidatedPdf } from '@/utils/report';
import { shareAsync } from 'expo-sharing';
import { money } from '@/utils/format';
import { getStockStatus } from '@/domain/rules';
import { colors } from '@/theme';

export default function Reports(){const{data,session}=useApp();if(session?.role!=='admin')return <Screen><Card><Text style={{color:colors.text}}>Relatórios consolidados são restritos ao administrador.</Text></Card></Screen>;const exportCsv=async()=>{const head=['EPI','Categoria','Marca','Modelo','Tamanho','CA','Validade CA','Estoque atual','Estoque mínimo','Status','Valor unitário','Fornecedor'];const rows=data.epis.map(e=>[e.name,e.category,e.brand,e.model,e.size,e.ca,e.caValidity,e.stock,e.minStock,getStockStatus(e),e.unitValue,e.supplier]);const esc=(v:unknown)=>`"${String(v).replaceAll('"','""')}"`;const csv=[head,...rows].map(r=>r.map(esc).join(';')).join('\n');const base=FileSystem.cacheDirectory;if(!base)throw new Error('Diretório temporário indisponível');const uri=`${base}estoque-atc-controle-epi.csv`;await FileSystem.writeAsStringAsync(uri,'\uFEFF'+csv);await shareAsync(uri,{mimeType:'text/csv',dialogTitle:'Compartilhar relatório CSV'});};return <Screen><SectionTitle>Resumo</SectionTitle><Card><Text style={styles.big}>{data.employees.filter(e=>e.status==='Ativo').length} colaboradores ativos</Text><Text style={styles.meta}>{data.epis.length} EPIs cadastrados</Text><Text style={styles.meta}>{money(data.purchases.reduce((s,p)=>s+p.total,0))} em compras registradas</Text></Card><PrimaryButton label="Exportar PDF consolidado" icon="document-text" onPress={()=>exportConsolidatedPdf(data).catch(()=>Alert.alert('Falha na exportação'))}/><PrimaryButton label="Exportar estoque em CSV" icon="grid" onPress={()=>exportCsv().catch(()=>Alert.alert('Falha na exportação'))}/></Screen>}
const styles=StyleSheet.create({big:{fontWeight:'900',fontSize:19,color:colors.text},meta:{color:colors.muted,marginTop:5}});
