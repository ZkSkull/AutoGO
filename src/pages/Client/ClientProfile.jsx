import { useState } from 'react';
import Modal from '../../components/Modal';
import { addressesApi, vehiclesApi } from '../../lib/api';

function AddressForm({ show, onClose, onSave, addressCount }) {
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!street.trim()) return;
    setSaving(true);
    await onSave({ street, number, city, state, is_default: addressCount === 0 });
    setSaving(false);
    setStreet(''); setNumber(''); setCity(''); setState('');
    onClose();
  };

  return (
    <Modal open={show} title="Novo Endereço" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Logradouro *</label>
          <input placeholder="Rua das Flores" value={street} onChange={e => setStreet(e.target.value)} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Número</label>
            <input placeholder="123" value={number} onChange={e => setNumber(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Estado (UF)</label>
            <input placeholder="SP" value={state} onChange={e => setState(e.target.value.toUpperCase())} maxLength={2} />
          </div>
        </div>
        <div className="form-group">
          <label>Cidade</label>
          <input placeholder="São Paulo" value={city} onChange={e => setCity(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar endereço'}
        </button>
      </form>
    </Modal>
  );
}

function VehicleForm({ show, onClose, onSave }) {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim()) return;
    setSaving(true);
    await onSave({ brand, model, year: parseInt(year) || null });
    setSaving(false);
    setBrand(''); setModel(''); setYear('');
    onClose();
  };

  return (
    <Modal open={show} title="Adicionar Veículo" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Marca *</label>
          <input placeholder="Volkswagen" value={brand} onChange={e => setBrand(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Modelo *</label>
          <input placeholder="Gol" value={model} onChange={e => setModel(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Ano</label>
          <input type="number" placeholder="2020" value={year} onChange={e => setYear(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
          {saving ? 'Salvando...' : 'Adicionar veículo'}
        </button>
      </form>
    </Modal>
  );
}

export default function ClientProfile({
  user, profileForm, setProfileForm, profSaving, saveProfile,
  addresses, addrLoading, loadAddresses, removeAddress,
  vehicles, showToast,
}) {
  const [addrForm, setAddrForm] = useState(false);
  const [vehForm, setVehForm] = useState(false);

  const handleAddAddress = async (data) => {
    try {
      await addressesApi.create(user.id, data);
      loadAddresses();
      showToast('Endereço adicionado!', 'success');
    } catch (err) { showToast('Erro: '+err.message, 'error'); }
  };

  const handleAddVehicle = async (data) => {
    try {
      await vehiclesApi.create(user.id, data);
      showToast('Veículo adicionado!', 'success');
    } catch (err) { showToast('Erro: '+err.message, 'error'); }
  };

  return (
    <div>
      <h2 style={{fontFamily:'var(--font-head)',fontSize:'1.8rem',fontWeight:900,marginBottom:'1.5rem'}}>Meu Perfil</h2>
      <div className="settings-grid">
        <div className="dash-card">
          <h3 style={{fontFamily:'var(--font-head)',fontSize:'1.1rem',fontWeight:700,marginBottom:'1.2rem'}}>Dados pessoais</h3>
          <form onSubmit={saveProfile}>
            {[['Nome','name','text'],['Telefone','phone','tel'],['CPF','cpf','text']].map(([label,field,type])=>(
              <div key={field} className="form-group">
                <label>{label}</label>
                <input type={type} value={profileForm[field]||''} onChange={e=>setProfileForm(f=>({...f,[field]:e.target.value}))} />
              </div>
            ))}
            <div className="form-group"><label>E-mail</label><input value={user?.email||''} disabled style={{opacity:.6}} /></div>
            <button type="submit" className="btn btn-primary" disabled={profSaving}>
              {profSaving?<><i className="fa-solid fa-spinner fa-spin" /> Salvando…</>:'Salvar'}
            </button>
          </form>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div className="dash-card">
            <h3 style={{fontFamily:'var(--font-head)',fontSize:'1.1rem',fontWeight:700,marginBottom:'1rem'}}>Endereços</h3>
            {addrLoading?<div className="loading-pulse" style={{height:60}} />:addresses.map(a=>(
              <div key={a.id} style={{display:'flex',alignItems:'center',gap:'.8rem',background:'var(--gray-100)',borderRadius:'var(--radius)',padding:'.75rem 1rem',marginBottom:'.5rem'}}>
                <i className="fa-solid fa-location-dot" style={{color:'var(--red)'}} />
                <span style={{flex:1,fontSize:'.9rem'}}>{a.street}{a.number?`, ${a.number}`:''} — {a.city}, {a.state}</span>
                {a.is_default&&<span style={{fontSize:'.72rem',background:'var(--red)',color:'#fff',padding:'.15rem .5rem',borderRadius:4}}>Principal</span>}
                <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--gray-400)'}} onClick={()=>removeAddress(a.id)}><i className="fa-solid fa-xmark" /></button>
              </div>
            ))}
            <button className="btn btn-outline btn-full" style={{marginTop:'.5rem'}} onClick={() => setAddrForm(true)}><i className="fa-solid fa-plus" /> Novo endereço</button>
          </div>

          <div className="dash-card">
            <h3 style={{fontFamily:'var(--font-head)',fontSize:'1.1rem',fontWeight:700,marginBottom:'1rem'}}>Veículos</h3>
            <div style={{display:'flex',gap:'.7rem',flexWrap:'wrap'}}>
              {vehicles.map(v=>(
                <div key={v.id} style={{display:'flex',alignItems:'center',gap:'.5rem',background:'var(--gray-100)',border:'2px solid var(--gray-200)',borderRadius:'var(--radius)',padding:'.5rem 1rem',fontSize:'.88rem'}}>
                  <i className="fa-solid fa-car" style={{color:'var(--red)'}} />{v.brand} {v.model} {v.year&&`(${v.year})`}
                </div>
              ))}
            </div>
            <button className="btn btn-outline" style={{marginTop:'1rem'}} onClick={() => setVehForm(true)}><i className="fa-solid fa-plus" /> Adicionar veículo</button>
          </div>
        </div>
      </div>

      <AddressForm show={addrForm} onClose={() => setAddrForm(false)} onSave={handleAddAddress} addressCount={addresses.length} />
      <VehicleForm show={vehForm} onClose={() => setVehForm(false)} onSave={handleAddVehicle} />
    </div>
  );
}