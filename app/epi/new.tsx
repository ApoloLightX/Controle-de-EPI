import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Field, PrimaryButton, Screen } from '@/components/UI';
import { useApp } from '@/context/AppContext';

export default function NewEpi() {
  const { session, addEpi } = useApp();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [size, setSize] = useState('Único');
  const [ca, setCa] = useState('');
  const [caValidity, setCaValidity] = useState('2027-12-31');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('5');
  const [unitValue, setUnitValue] = useState('0');
  const [supplier, setSupplier] = useState('');
  const [saving, setSaving] = useState(false);

  if (session?.role !== 'admin') return <Screen><Field label="Acesso" value="Somente administradores podem cadastrar EPIs." editable={false} /></Screen>;

  const save = async () => {
    if (!name.trim() || !category.trim() || !brand.trim() || !ca.trim() || !supplier.trim()) return Alert.alert('Campos obrigatórios', 'Preencha nome, categoria, marca, CA e fornecedor.');
    const currentStock = Number(stock.replace(',', '.'));
    const minimum = Number(minStock.replace(',', '.'));
    const value = Number(unitValue.replace(',', '.'));
    if (!Number.isInteger(currentStock) || currentStock < 0 || !Number.isInteger(minimum) || minimum < 0 || !Number.isFinite(value) || value < 0) return Alert.alert('Valores inválidos', 'Estoque atual e mínimo precisam ser inteiros não negativos. Confira também o valor unitário.');
    if (Number.isNaN(new Date(`${caValidity}T12:00:00`).getTime())) return Alert.alert('Data inválida', 'Use a validade do CA no formato AAAA-MM-DD.');
    setSaving(true);
    await addEpi({ name: name.trim(), category: category.trim(), brand: brand.trim(), model: model.trim(), size: size.trim(), ca: ca.trim(), caValidity, stock: currentStock, minStock: minimum, unitValue: value, supplier: supplier.trim() });
    setSaving(false);
    router.back();
  };

  return <Screen><View style={{ gap: 14 }}>
    <Field label="Nome do EPI" value={name} onChangeText={setName} />
    <Field label="Categoria" value={category} onChangeText={setCategory} />
    <Field label="Marca" value={brand} onChangeText={setBrand} />
    <Field label="Modelo" value={model} onChangeText={setModel} />
    <Field label="Tamanho" value={size} onChangeText={setSize} />
    <Field label="CA" value={ca} onChangeText={setCa} keyboardType="number-pad" />
    <Field label="Validade do CA (AAAA-MM-DD)" value={caValidity} onChangeText={setCaValidity} />
    <Field label="Estoque inicial" value={stock} onChangeText={setStock} keyboardType="number-pad" />
    <Field label="Estoque mínimo" value={minStock} onChangeText={setMinStock} keyboardType="number-pad" />
    <Field label="Valor unitário" value={unitValue} onChangeText={setUnitValue} keyboardType="decimal-pad" />
    <Field label="Fornecedor" value={supplier} onChangeText={setSupplier} />
    <PrimaryButton label="Cadastrar EPI" icon="checkmark" loading={saving} onPress={save} />
  </View></Screen>;
}
