import axiosInstance from "../utils/axios";

export const actaService = {
  async enviarActa(
    mesaId: string, 
    fotos: File[], 
    observaciones: string, 
    votos: any
  ): Promise<any> {
    const formData = new FormData();
    formData.append('mesaId', mesaId);
    formData.append('observaciones', observaciones);
    formData.append('votos', JSON.stringify(votos));
    
    fotos.forEach((foto) => {
      formData.append('fotos_actas', foto);
    });

    const { data } = await axiosInstance.post('/actas', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  }
};
