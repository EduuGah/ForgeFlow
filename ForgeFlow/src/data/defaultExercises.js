const defaultExercises = [
  {
    "name": "Supino Reto",
    "muscleGroup": "Peito",
    "equipment": "Barra",
    "description": "Base para força e volume do peitoral maior"
  },
  {
    "name": "Supino Inclinado",
    "muscleGroup": "Peito",
    "equipment": "Barra",
    "description": "Foco na porção superior (clavicular)"
  },
  {
    "name": "Supino Declinado",
    "muscleGroup": "Peito",
    "equipment": "Barra",
    "description": "Ênfase na porção inferior do peitoral"
  },
  {
    "name": "Supino com Halteres",
    "muscleGroup": "Peito",
    "equipment": "Halter",
    "description": "Maior amplitude de movimento e trabalho de estabilização"
  },
  {
    "name": "Crucifixo Reto",
    "muscleGroup": "Peito",
    "equipment": "Halter",
    "description": "Isolamento peitoral com foco em alongamento"
  },
  {
    "name": "Chest Press Articulado",
    "muscleGroup": "Peito",
    "equipment": "Máquina",
    "description": "Segurança para progressão de carga máxima"
  },
  {
    "name": "Pec Deck (Voador)",
    "muscleGroup": "Peito",
    "equipment": "Máquina",
    "description": "Isolamento de peitoral com tensão constante"
  },
  {
    "name": "Puxada Frontal Aberta",
    "muscleGroup": "Costas",
    "equipment": "Máquina",
    "description": "Foco na largura do latíssimo do dorso"
  },
  {
    "name": "Puxada Triângulo",
    "muscleGroup": "Costas",
    "equipment": "Máquina",
    "description": "Enfâse na porção central das costas"
  },
  {
    "name": "Remada Curvada Pronada",
    "muscleGroup": "Costas",
    "equipment": "Barra",
    "description": "Exercício multiarticular para densidade das costas"
  },
  {
    "name": "Remada Cavalinho",
    "muscleGroup": "Costas",
    "equipment": "Barra",
    "description": "Trabalho pesado de espessura de tronco"
  },
  {
    "name": "Remada Baixa",
    "muscleGroup": "Costas",
    "equipment": "Máquina",
    "description": "Trabalho de romboides e trapézio médio"
  },
  {
    "name": "Remada Unilateral (Serrote)",
    "muscleGroup": "Costas",
    "equipment": "Halter",
    "description": "Correção de assimetrias e grande amplitude"
  },
  {
    "name": "Pull Down",
    "muscleGroup": "Costas",
    "equipment": "Máquina",
    "description": "Isolamento de grande dorsal"
  },
  {
    "name": "Desenvolvimento Militar",
    "muscleGroup": "Ombros",
    "equipment": "Barra",
    "description": "Construtor de força bruta para ombros"
  },
  {
    "name": "Desenvolvimento Arnold",
    "muscleGroup": "Ombros",
    "equipment": "Halter",
    "description": "Rotação que trabalha todas as cabeças do deltoide"
  },
  {
    "name": "Elevação Lateral",
    "muscleGroup": "Ombros",
    "equipment": "Halter",
    "description": "Foco total na cabeça lateral do deltoide"
  },
  {
    "name": "Elevação Frontal",
    "muscleGroup": "Ombros",
    "equipment": "Halter",
    "description": "Isolamento de deltoide anterior"
  },
  {
    "name": "Crucifixo Inverso",
    "muscleGroup": "Ombros",
    "equipment": "Halter",
    "description": "Foco em deltoide posterior e postura"
  },
  {
    "name": "Encolhimento",
    "muscleGroup": "Ombros",
    "equipment": "Barra",
    "description": "Trabalho de trapézio superior"
  },
  {
    "name": "Rosca Direta",
    "muscleGroup": "Bíceps",
    "equipment": "Barra",
    "description": "O exercício definitivo para volume de bíceps"
  },
  {
    "name": "Rosca Alternada",
    "muscleGroup": "Bíceps",
    "equipment": "Halter",
    "description": "Trabalho unilateral com supinação"
  },
  {
    "name": "Rosca Martelo",
    "muscleGroup": "Bíceps",
    "equipment": "Halter",
    "description": "Foco em braquial e braquiorradial"
  },
  {
    "name": "Rosca Concentrada",
    "muscleGroup": "Bíceps",
    "equipment": "Halter",
    "description": "Isolamento máximo para pico de bíceps"
  },
  {
    "name": "Rosca Scott",
    "muscleGroup": "Bíceps",
    "equipment": "Máquina",
    "description": "Elimina o roubo e foca na porção inferior do bíceps"
  },
  {
    "name": "Tríceps Pulley Barra Reta",
    "muscleGroup": "Tríceps",
    "equipment": "Máquina",
    "description": "Tensão constante na cabeça lateral"
  },
  {
    "name": "Tríceps Corda",
    "muscleGroup": "Tríceps",
    "equipment": "Máquina",
    "description": "Permite maior rotação e contração do tríceps"
  },
  {
    "name": "Tríceps Testa",
    "muscleGroup": "Tríceps",
    "equipment": "Barra",
    "description": "Foco intenso na cabeça longa do tríceps"
  },
  {
    "name": "Tríceps Francês Unilateral",
    "muscleGroup": "Tríceps",
    "equipment": "Halter",
    "description": "Grande alongamento da fibra muscular"
  },
  {
    "name": "Agachamento Livre",
    "muscleGroup": "Pernas",
    "equipment": "Barra",
    "description": "Rei dos exercícios, trabalha toda a cadeia inferior"
  },
  {
    "name": "Leg Press 45",
    "muscleGroup": "Pernas",
    "equipment": "Máquina",
    "description": "Foco em quadríceps com segurança lombar"
  },
  {
    "name": "Hack Squat",
    "muscleGroup": "Pernas",
    "equipment": "Máquina",
    "description": "Ênfase profunda em quadríceps"
  },
  {
    "name": "Afundo / Passada",
    "muscleGroup": "Pernas",
    "equipment": "Halter",
    "description": "Trabalho dinâmico de pernas e equilíbrio"
  },
  {
    "name": "Cadeira Extensora",
    "muscleGroup": "Pernas",
    "equipment": "Máquina",
    "description": "Isolamento total de quadríceps"
  },
  {
    "name": "Mesa Flexora",
    "muscleGroup": "Pernas",
    "equipment": "Máquina",
    "description": "Foco em posteriores de coxa (isquiotibiais)"
  },
  {
    "name": "Cadeira Flexora",
    "muscleGroup": "Pernas",
    "equipment": "Máquina",
    "description": "Posteriores de coxa em posição sentada"
  },
  {
    "name": "Stiff",
    "muscleGroup": "Pernas",
    "equipment": "Barra",
    "description": "Foco em cadeia posterior e glúteos"
  },
  {
    "name": "Elevação Pélvica",
    "muscleGroup": "Glúteos",
    "equipment": "Barra",
    "description": "Melhor exercício para força e estética de glúteos"
  },
  {
    "name": "Cadeira Abdutora",
    "muscleGroup": "Glúteos",
    "equipment": "Máquina",
    "description": "Foco em glúteo médio e estabilidade de quadril"
  },
  {
    "name": "Gêmeos em Pé",
    "muscleGroup": "Panturrilhas",
    "equipment": "Máquina",
    "description": "Foco no gastrocnêmio"
  },
  {
    "name": "Gêmeos Sentado",
    "muscleGroup": "Panturrilhas",
    "equipment": "Máquina",
    "description": "Foco no sóleo"
  },
  {
    "name": "Abdominal Supra",
    "muscleGroup": "Abdômen",
    "equipment": "Mobilidade",
    "description": "Foco na porção superior do reto abdominal"
  },
  {
    "name": "Abdominal Infra",
    "muscleGroup": "Abdômen",
    "equipment": "Mobilidade",
    "description": "Foco na porção inferior do abdômen"
  },
  {
    "name": "Plancha Isométrica",
    "muscleGroup": "Abdômen",
    "equipment": "Mobilidade",
    "description": "Fortalecimento do core e estabilidade"
  },
  {
    "name": "Abdominal Máquina",
    "muscleGroup": "Abdômen",
    "equipment": "Máquina",
    "description": "Permite adicionar carga ao treino de abdômen"
  },
  {
    "name": "Gato-Camelo",
    "muscleGroup": "Mobilidade",
    "equipment": "Mobilidade",
    "description": "Mobilização da coluna vertebral"
  },
  {
    "name": "World Greatest Stretch",
    "muscleGroup": "Mobilidade",
    "equipment": "Mobilidade",
    "description": "Mobilidade completa de quadril, coluna e ombros"
  },
  {
    "name": "Liberação de Torácica",
    "muscleGroup": "Mobilidade",
    "equipment": "Mobilidade",
    "description": "Melhora a postura e amplitude de treinos de ombro"
  },
  {
    "name": "90/90 Quadril",
    "muscleGroup": "Mobilidade",
    "equipment": "Mobilidade",
    "description": "Mobilidade de rotação interna e externa de quadril"
  },
  {
    "name": "Supino Reto com Halteres",
    "muscleGroup": "Peito",
    "equipment": "Halter",
    "description": "Maior amplitude e recrutamento de fibras estabilizadoras"
  },
  {
    "name": "Crucifixo Inclinado",
    "muscleGroup": "Peito",
    "equipment": "Halter",
    "description": "Isolamento da parte superior do peito"
  },
  {
    "name": "Dips (Paralelas)",
    "muscleGroup": "Peito",
    "equipment": "Mobilidade",
    "description": "Foco na parte inferior do peito e tríceps"
  },
  {
    "name": "Pullover",
    "muscleGroup": "Peito",
    "equipment": "Halter",
    "description": "Trabalha a expansão da caixa torácica e serrátil"
  },
  {
    "name": "Puxada com Pegada Supinada",
    "muscleGroup": "Costas",
    "equipment": "Máquina",
    "description": "Maior ativação de bíceps e latíssimo inferior"
  },
  {
    "name": "Remada Articulada",
    "muscleGroup": "Costas",
    "equipment": "Máquina",
    "description": "Movimento guiado para máxima contração escapular"
  },
  {
    "name": "Levantamento Terra",
    "muscleGroup": "Costas",
    "equipment": "Barra",
    "description": "Exercício composto para toda a cadeia posterior"
  },
  {
    "name": "Face Pull",
    "muscleGroup": "Ombros",
    "equipment": "Máquina",
    "description": "Foco em deltoide posterior e saúde dos ombros"
  },
  {
    "name": "Elevação Lateral no Cabo",
    "muscleGroup": "Ombros",
    "equipment": "Máquina",
    "description": "Tensão constante em toda a fase do movimento"
  },
  {
    "name": "Remada Alta",
    "muscleGroup": "Ombros",
    "equipment": "Barra",
    "description": "Foco em deltoide lateral e trapézio"
  },
  {
    "name": "Rosca Inclinada",
    "muscleGroup": "Bíceps",
    "equipment": "Halter",
    "description": "Máximo alongamento da cabeça longa do bíceps"
  },
  {
    "name": "Rosca 21",
    "muscleGroup": "Bíceps",
    "equipment": "Barra",
    "description": "Técnica de resistência com repetições parciais"
  },
  {
    "name": "Rosca Inversa",
    "muscleGroup": "Bíceps",
    "equipment": "Barra",
    "description": "Foco no braquiorradial e antebraço"
  },
  {
    "name": "Mergulho no Banco",
    "muscleGroup": "Tríceps",
    "equipment": "Mobilidade",
    "description": "Foco na porção medial e lateral do tríceps"
  },
  {
    "name": "Tríceps Coice",
    "muscleGroup": "Tríceps",
    "equipment": "Halter",
    "description": "Isolamento da cabeça lateral do tríceps"
  },
  {
    "name": "Agachamento Sumô",
    "muscleGroup": "Pernas",
    "equipment": "Halter",
    "description": "Maior ativação de adutores e glúteos"
  },
  {
    "name": "Agachamento Búlgaro",
    "muscleGroup": "Pernas",
    "equipment": "Halter",
    "description": "Unilateral intenso para quadríceps e glúteo"
  },
  {
    "name": "Cadeira Adutora",
    "muscleGroup": "Pernas",
    "equipment": "Máquina",
    "description": "Isolamento dos músculos internos da coxa"
  },
  {
    "name": "Flexora Vertical",
    "muscleGroup": "Pernas",
    "equipment": "Máquina",
    "description": "Isolamento de posteriores de coxa em pé"
  },
  {
    "name": "Glúteo Cabo (Coice)",
    "muscleGroup": "Glúteos",
    "equipment": "Máquina",
    "description": "Isolamento máximo do glúteo maior"
  },
  {
    "name": "Glúteo Máquina",
    "muscleGroup": "Glúteos",
    "equipment": "Máquina",
    "description": "Extensão de quadril controlada"
  },
  {
    "name": "Gêmeos no Leg Press",
    "muscleGroup": "Panturrilhas",
    "equipment": "Máquina",
    "description": "Trabalho de panturrilha com pernas estendidas"
  },
  {
    "name": "Abdominal Oblíquo",
    "muscleGroup": "Abdômen",
    "equipment": "Mobilidade",
    "description": "Foco nos músculos laterais do abdômen"
  },
  {
    "name": "Prancha Lateral",
    "muscleGroup": "Abdômen",
    "equipment": "Mobilidade",
    "description": "Estabilidade lateral e fortalecimento do core"
  },
  {
    "name": "Abdominal Rodinha",
    "muscleGroup": "Abdômen",
    "equipment": "Mobilidade",
    "description": "Exercício avançado de anti-extensão lombar"
  },
  {
    "name": "Mobilidade de Tornozelo",
    "muscleGroup": "Mobilidade",
    "equipment": "Mobilidade",
    "description": "Essencial para profundidade no agachamento"
  },
  {
    "name": "Espaçamento Escapular",
    "muscleGroup": "Mobilidade",
    "equipment": "Mobilidade",
    "description": "Melhora a mecânica de empurrar e puxar"
  },
  {
    "name": "Fly Inclinado com Halteres",
    "muscleGroup": "Peito",
    "equipment": "Halter",
    "description": "Isolamento da parte superior do peito com foco em abertura"
  },
  {
    "name": "Landmine Press",
    "muscleGroup": "Peito",
    "equipment": "Barra",
    "description": "Excelente para saúde do ombro e porção superior do peito"
  },
  {
    "name": "Barra Fixa (Pull-up)",
    "muscleGroup": "Costas",
    "equipment": "Mobilidade",
    "description": "O melhor exercício de peso corporal para largura de costas"
  },
  {
    "name": "Remada com Halteres no Banco Inclinado",
    "muscleGroup": "Costas",
    "equipment": "Halter",
    "description": "Estabiliza o tronco e isola totalmente os dorsais"
  },
  {
    "name": "Elevação Y (Y-Raise)",
    "muscleGroup": "Ombros",
    "equipment": "Halter",
    "description": "Foco em deltoide posterior e estabilidade de escápula"
  },
  {
    "name": "Crucifixo Inverso na Máquina",
    "muscleGroup": "Ombros",
    "equipment": "Máquina",
    "description": "Tensão constante no deltoide posterior"
  },
  {
    "name": "Rosca Aranha (Spider Curl)",
    "muscleGroup": "Bíceps",
    "equipment": "Barra",
    "description": "Isolamento extremo do bíceps em posição encurtada"
  },
  {
    "name": "Rosca Zottman",
    "muscleGroup": "Bíceps",
    "equipment": "Halter",
    "description": "Combina rosca normal com descida inversa para antebraço"
  },
  {
    "name": "Tríceps Francês no Cabo",
    "muscleGroup": "Tríceps",
    "equipment": "Máquina",
    "description": "Tensão constante em posição de máximo alongamento"
  },
  {
    "name": "Extensão de Tríceps Unilateral",
    "muscleGroup": "Tríceps",
    "equipment": "Halter",
    "description": "Foco na cabeça lateral e correção de assimetria"
  },
  {
    "name": "Goblet Squat",
    "muscleGroup": "Pernas",
    "equipment": "Halter",
    "description": "Ótimo para aprender a postura correta do agachamento"
  },
  {
    "name": "Good Morning",
    "muscleGroup": "Pernas",
    "equipment": "Barra",
    "description": "Foco pesado em posteriores de coxa e lombar"
  },
  {
    "name": "Cadeira Abdutora (Tronco à frente)",
    "muscleGroup": "Glúteos",
    "equipment": "Máquina",
    "description": "Variação para maior recrutamento de glúteo máximo"
  },
  {
    "name": "Abdominal Canivete",
    "muscleGroup": "Abdômen",
    "equipment": "Mobilidade",
    "description": "Trabalho integrado de supra e infra abdominal"
  },
  {
    "name": "Dead Bug",
    "muscleGroup": "Abdômen",
    "equipment": "Mobilidade",
    "description": "Essencial para estabilidade lombar e controle do core"
  },
  {
    "name": "Mobilidade de Punho",
    "muscleGroup": "Mobilidade",
    "equipment": "Mobilidade",
    "description": "Previne dores em exercícios de empurrar e roscas"
  },
  {
    "name": "Liberação de Grande Dorsal",
    "muscleGroup": "Mobilidade",
    "equipment": "Mobilidade",
    "description": "Melhora a amplitude de movimento acima da cabeça"
  }
]

export default defaultExercises