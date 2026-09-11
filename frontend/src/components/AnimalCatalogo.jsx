import { useEffect, useState } from 'react';
import { API_URL } from '../api/config';

const formularioInicial = {
  autor: '',
  calificacion: '5',
  comentario: '',
};

function AnimalCatalogo() {


  const [animales, setAnimales] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [recintos, setRecintos] = useState([]);
  const [especieId, setEspecieId] = useState('');
  const [recintoId, setRecintoId] = useState('');
  const [animalitoSeleccionado, setAnimalSeleccionado] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [error, setError] = useState(null);
  const [errorComentario, setErrorComentario] = useState(null);


  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/especies`),
      fetch(`${API_URL}/recintos`),])
      .then(async ([especiesResponse, recintosResponse]) => {
        if (!especiesResponse.ok || !recintosResponse.ok) {

          throw new Error('error filtro');
        }
        const [especiesData, recintosData] = await Promise.all([
          especiesResponse.json(),
          recintosResponse.json(),]);
        setEspecies(especiesData);
        setRecintos(recintosData);})
      .catch(() => setError('error filtro'));
  }, []);



  useEffect(() => {
    const parametros = new URLSearchParams();
    if (especieId) parametros.set('especieId', especieId);
    if (recintoId) parametros.set('recintoId', recintoId);
    const query = parametros.toString();



    fetch(`${API_URL}/animals${query ? `?${query}` : ''}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('error carga animales 1');
        return response.json();}).then((data) => {
        setAnimales(data);
        setCargando(false);
      }).catch(() => {
        setError('error carga animales 2');
        setCargando(false);});
  }, [especieId, recintoId]);



  const seleccionarAnimal = (animal) => {
    setAnimalSeleccionado(animal);
    setComentarios([]);
    setErrorComentario(null);
    setCargandoComentarios(true);



    fetch(`${API_URL}/animals/${animal.id}/comments`)
      .then(async (response) => {
        if (!response.ok) throw new Error('error carga comentarios');
        return response.json();
      })
      .then((data) => setComentarios(data.comentarios ?? []))
      .catch(() => setErrorComentario('error carga comentarios'))
      .finally(() => setCargandoComentarios(false));
  };



  const cambiarFormulario = (event) => {
    const { name, value } = event.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };



  const enviarComentario = (event) => {
    event.preventDefault();
    if (!animalitoSeleccionado) return;



    setErrorComentario(null);
    fetch(`${API_URL}/animals/${animalitoSeleccionado.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formulario,
        calificacion: Number(formulario.calificacion),}),}).then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          const detalles = data.detalles?.map((detalle) => detalle.mensaje).join(' ');
          throw new Error(detalles || data.error || 'error carga comentarios');
        }
        return data;})
      .then((nuevoComentario) => {
        setComentarios((actuales) => [...actuales, nuevoComentario]);
        setFormulario(formularioInicial);})
      .catch((err) => setErrorComentario(err.message));
  };


  // ------------------------------------------------------------------------
  return (
    <section>
      <h2>Catalogo de animales uwu</h2>

      <label>
        Especie:{' '}
        <select value={especieId} onChange={(event) => setEspecieId(event.target.value)}>
          <option value="">Todas</option>
          {especies.map((especie) => (
            <option key={especie.id} value={especie.id}>
              {especie.nombre} ({especie.id})
            </option>
          ))}
        </select>
      </label>{' '}
      <label>
        Recinto:{' '}
        <select value={recintoId} onChange={(event) => setRecintoId(event.target.value)}>
          <option value="">Todos</option>
          {recintos.map((recinto) => (
            <option key={recinto.id} value={recinto.id}>
              {recinto.nombre} ({recinto.id})
            </option>
          ))}
        </select>
      </label>

      {error && <p>{error}</p>}
      {cargando ? <p>Cargando animales...</p> : (
        <ul>
          {animales.map((animal) => (
            <li key={animal.id}>
              <button type="button" onClick={() => seleccionarAnimal(animal)}>
                {animal.nombre}
              </button>{' '}
              ({animal.especie?.nombre}, {animal.recinto?.nombre})
            </li>
          ))}
        </ul>
      )}

      {animalitoSeleccionado && (
        <div>
          <h3>{animalitoSeleccionado.nombre}</h3>
          <p>Edad: {animalitoSeleccionado.edad} | Peso: {animalitoSeleccionado.peso ?? 'No informado'}</p>
          <p>Especie: {animalitoSeleccionado.especie?.nombre} | Recinto: {animalitoSeleccionado.recinto?.nombre}</p>

          <h4>Comentarios :)</h4>
          {cargandoComentarios ? <p>Cargando comentarios...</p> : (
            comentarios.length > 0 ? (
              <ul>
                {comentarios.map((comentario) => (
                  <li key={comentario.id}>
                    <strong>{comentario.autor}</strong> ({comentario.calificacion}/5): {comentario.comentario}
                  </li>
                ))}
              </ul>
            ) : <p>sin comentarios</p>
          )}

          <form onSubmit={enviarComentario}>
            <h4>Agregar comentario</h4>
            <label>
              Autor:{' '}
              <input name="autor" value={formulario.autor} onChange={cambiarFormulario} required />
            </label>{' '}
            <label>
              Calificación:{' '}
              <select name="calificacion" value={formulario.calificacion} onChange={cambiarFormulario}>
                {[1, 2, 3, 4, 5].map((valor) => <option key={valor} value={valor}>{valor}</option>)}
              </select>
            </label>
            <br />
            <label>
              Comentario:{' '}
              <textarea name="comentario" value={formulario.comentario} onChange={cambiarFormulario} required />
            </label>
            <br />
            <button type="submit">Publicar comentario</button>
          </form>
          {errorComentario && <p role="alert">{errorComentario}</p>}
        </div>
      )}
    </section>
  );
}

export default AnimalCatalogo;